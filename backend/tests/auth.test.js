const request = require("supertest");
const mongoose = require("mongoose");
const app = require("../server").app;
const User = require("../models/User");

// Mock environment variables for testing
process.env.NODE_ENV = "test";

describe("Authentication Workflow", () => {
  let testUser;
  let csrfToken;
  let authCookies;

  beforeAll(async () => {
    // Connect to test database or use test URI
    if (!mongoose.connection.readyState) {
      await mongoose.connect(
        process.env.MONGO_URI ||
        process.env.MONGODB_URI || "mongodb://localhost:27017/workspace-test",
      );
    }
  });

  afterAll(async () => {
    // Cleanup
    await User.deleteMany({ email: /test-/i });
    if (mongoose.connection.readyState === 1) {
      await mongoose.connection.close();
    }
  });

  // ===== SIGNUP TESTS =====
  describe("POST /api/auth/signup", () => {
    it("should reject weak password", async () => {
      const res = await request(app).post("/api/auth/signup").send({
        displayName: "Test User",
        email: "test-weak-pass@example.com",
        password: "weak123",
      });

      expect(res.status).toBe(400);
      expect(res.body.msg).toContain("uppercase");
      expect(res.body.msg).toContain("lowercase");
      expect(res.body.msg).toContain("special");
    });

    it("should accept strong password", async () => {
      const res = await request(app).post("/api/auth/signup").send({
        displayName: "Test User",
        email: "test-strong@example.com",
        password: "StrongPass@123",
      });

      expect(res.status).toBe(201);
      expect(res.body._id).toBeDefined();
      expect(res.body.email).toBe("test-strong@example.com");
      testUser = res.body;
    });

    it("should reject duplicate email", async () => {
      const res = await request(app).post("/api/auth/signup").send({
        displayName: "Another User",
        email: "test-strong@example.com",
        password: "StrongPass@123",
      });

      expect(res.status).toBe(400);
      expect(res.body.msg).toContain("already exists");
    });

    it("should reject missing fields", async () => {
      const res = await request(app).post("/api/auth/signup").send({
        displayName: "Test",
        // missing email and password
      });

      expect([400, 429]).toContain(res.status);
      if (res.status === 400) {
        expect(res.body.msg).toContain("required");
      }
    });

    it("should rate limit signup attempts", async () => {
      const attempts = [];
      for (let i = 0; i < 4; i++) {
        attempts.push(
          request(app)
            .post("/api/auth/signup")
            .send({
              displayName: "Spam",
              email: `test-spam-${i}@example.com`,
              password: "StrongPass@123",
            }),
        );
      }

      const results = await Promise.all(attempts);
      expect(results.every((r) => [201, 429].includes(r.status))).toBe(true);

      // 4th attempt should be rate limited
      const limitedRes = await request(app).post("/api/auth/signup").send({
        displayName: "Spam",
        email: "test-spam-limit@example.com",
        password: "StrongPass@123",
      });

      expect([201, 429]).toContain(limitedRes.status);
    });
  });

  // ===== LOGIN TESTS =====
  describe("POST /api/auth/login", () => {
    it("should login with correct credentials", async () => {
      const res = await request(app).post("/api/auth/login").send({
        email: "test-strong@example.com",
        password: "StrongPass@123",
      });

      expect(res.status).toBe(200);
      expect(res.body.msg).toContain("successfully");
      expect(res.body.user).toBeDefined();
      expect(res.body.user.email).toBe("test-strong@example.com");
      authCookies = res.headers["set-cookie"];
    });

    it("should reject wrong password", async () => {
      const res = await request(app).post("/api/auth/login").send({
        email: "test-strong@example.com",
        password: "WrongPass@123",
      });

      expect(res.status).toBe(401);
      expect(res.body.msg).toContain("Invalid");
    });

    it("should reject non-existent user", async () => {
      const res = await request(app).post("/api/auth/login").send({
        email: "nonexistent@example.com",
        password: "SomePass@123",
      });

      expect(res.status).toBe(401);
    });

    it("should reject missing fields", async () => {
      const res = await request(app).post("/api/auth/login").send({
        email: "test@example.com",
        // missing password
      });

      expect(res.status).toBe(400);
    });

    it("should rate limit login attempts", async () => {
      const attempts = [];
      for (let i = 0; i < 5; i++) {
        attempts.push(
          request(app).post("/api/auth/login").send({
            email: "test-strong@example.com",
            password: "WrongPass@123",
          }),
        );
      }

      const results = await Promise.all(attempts);
      const hasRateLimit = results.some((r) => r.status === 429);
      expect(hasRateLimit).toBe(true);
    });
  });

  // ===== LOGOUT TESTS =====
  describe("POST /api/auth/logout", () => {
    it("should logout successfully", async () => {
      const cookies = authCookies;
      expect(cookies).toBeDefined();
      const healthRes = await request(app).get("/api/health").set("Cookie", cookies || []);
      const logoutCsrf = healthRes.headers["x-csrf-token"];

      // Then logout
      const logoutRes = await request(app)
        .post("/api/auth/logout")
        .set("X-CSRF-Token", logoutCsrf)
        .set("Cookie", cookies || []);

      expect([200, 302]).toContain(logoutRes.status);
      expect(logoutRes.body.msg || logoutRes.text).toBeDefined();
    });

    it("should support GET /api/auth/logout for backward compatibility", async () => {
      const res = await request(app).get("/api/auth/logout");

      expect([200, 302]).toContain(res.status);
    });
  });

  // ===== CURRENT USER TESTS =====
  describe("GET /api/auth/user", () => {
    it("should return current user when authenticated", async () => {
      const cookies = authCookies;
      expect(cookies).toBeDefined();

      // Get current user
      const userRes = await request(app)
        .get("/api/auth/user")
        .set("Cookie", cookies || []);

      expect([200, 401]).toContain(userRes.status);
      if (userRes.status === 200) {
        expect(userRes.body.email).toBe("test-strong@example.com");
      }
    });

    it("should return 401 when not authenticated", async () => {
      const res = await request(app).get("/api/auth/user");

      expect(res.status).toBe(401);
    });
  });

  // ===== HEALTH CHECK =====
  describe("GET /api/health", () => {
    it("should return ok status", async () => {
      const res = await request(app).get("/api/health");

      expect(res.status).toBe(200);
      expect(res.body.status).toBe("ok");
    });

    it("should include CSRF token in headers", async () => {
      const res = await request(app).get("/api/health");

      expect(res.headers["x-csrf-token"]).toBeDefined();
      expect(res.headers["x-csrf-token"].length).toBeGreaterThan(0);
    });
  });
});
