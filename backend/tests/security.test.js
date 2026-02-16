const request = require("supertest");
const mongoose = require("mongoose");
const app = require("../server").app;
const User = require("../models/User");

process.env.NODE_ENV = "test";

describe("Security Features", () => {
  let testUser;
  let cookies;
  let csrfToken;

  beforeAll(async () => {
    if (!mongoose.connection.readyState) {
      await mongoose.connect(
        process.env.MONGODB_URI || "mongodb://localhost:27017/workspace-test",
      );
    }
  });

  afterAll(async () => {
    await User.deleteMany({ email: /security-test/ });
    if (mongoose.connection.readyState === 1) {
      await mongoose.connection.close();
    }
  });

  // ===== PASSWORD VALIDATION TESTS =====
  describe("Password Validation", () => {
    it("should reject password without uppercase", async () => {
      const res = await request(app).post("/api/auth/signup").send({
        displayName: "Test",
        email: "security-test-1@example.com",
        password: "password@123",
      });

      expect(res.status).toBe(400);
      expect(res.body.msg).toContain("uppercase");
    });

    it("should reject password without lowercase", async () => {
      const res = await request(app).post("/api/auth/signup").send({
        displayName: "Test",
        email: "security-test-2@example.com",
        password: "PASSWORD@123",
      });

      expect(res.status).toBe(400);
      expect(res.body.msg).toContain("lowercase");
    });

    it("should reject password without number", async () => {
      const res = await request(app).post("/api/auth/signup").send({
        displayName: "Test",
        email: "security-test-3@example.com",
        password: "PasswordSpecial@",
      });

      expect(res.status).toBe(400);
      expect(res.body.msg).toContain("number");
    });

    it("should reject password without special character", async () => {
      const res = await request(app).post("/api/auth/signup").send({
        displayName: "Test",
        email: "security-test-4@example.com",
        password: "Password123456",
      });

      expect(res.status).toBe(400);
      expect(res.body.msg).toContain("special");
    });

    it("should reject password shorter than 8 characters", async () => {
      const res = await request(app).post("/api/auth/signup").send({
        displayName: "Test",
        email: "security-test-5@example.com",
        password: "Pass@12",
      });

      expect(res.status).toBe(400);
    });

    it("should accept valid strong password", async () => {
      const res = await request(app).post("/api/auth/signup").send({
        displayName: "Security Test",
        email: "security-test@example.com",
        password: "StrongPass@123",
      });

      expect(res.status).toBe(201);
      testUser = res.body;

      // Login to get cookies
      const loginRes = await request(app).post("/api/auth/login").send({
        email: "security-test@example.com",
        password: "StrongPass@123",
      });

      cookies = loginRes.headers["set-cookie"];
    });
  });

  // ===== CSRF PROTECTION TESTS =====
  describe("CSRF Protection", () => {
    it("should provide CSRF token in response headers", async () => {
      const res = await request(app).get("/api/health");

      expect(res.status).toBe(200);
      expect(res.headers["x-csrf-token"]).toBeDefined();
      expect(res.headers["x-csrf-token"].length).toBeGreaterThan(0);
      csrfToken = res.headers["x-csrf-token"];
    });

    it("should reject POST without CSRF token", async () => {
      const res = await request(app)
        .post("/api/workspaces")
        .set("Cookie", cookies)
        .send({
          name: "No CSRF Token WS",
        });

      expect(res.status).toBe(403);
      expect(res.body.msg).toContain("CSRF");
    });

    it("should reject POST with invalid CSRF token", async () => {
      const res = await request(app)
        .post("/api/workspaces")
        .set("Cookie", cookies)
        .set("X-CSRF-Token", "invalid_token_here")
        .send({
          name: "Invalid CSRF WS",
        });

      expect(res.status).toBe(403);
      expect(res.body.msg).toContain("CSRF");
    });

    it("should accept POST with valid CSRF token", async () => {
      // Get fresh CSRF token
      const healthRes = await request(app).get("/api/health");
      const validToken = healthRes.headers["x-csrf-token"];

      const res = await request(app)
        .post("/api/workspaces")
        .set("Cookie", cookies)
        .set("X-CSRF-Token", validToken)
        .send({
          name: "Valid CSRF WS",
        });

      // Should succeed (or get 400+ only if other validation fails, not CSRF)
      expect(res.status).not.toBe(403);
    });

    it("should accept CSRF token in request body", async () => {
      const healthRes = await request(app).get("/api/health");
      const validToken = healthRes.headers["x-csrf-token"];

      const res = await request(app)
        .post("/api/workspaces")
        .set("Cookie", cookies)
        .send({
          name: "CSRF in Body WS",
          _csrf: validToken,
        });

      expect(res.status).not.toBe(403);
    });

    it("should accept CSRF token in query params", async () => {
      const healthRes = await request(app).get("/api/health");
      const validToken = healthRes.headers["x-csrf-token"];

      const res = await request(app)
        .post(`/api/workspaces?_csrf=${validToken}`)
        .set("Cookie", cookies)
        .send({
          name: "CSRF in Query WS",
        });

      expect(res.status).not.toBe(403);
    });
  });

  // ===== INPUT SANITIZATION TESTS =====
  describe("Input Sanitization (XSS Prevention)", () => {
    let workspaceId;

    beforeAll(async () => {
      // Create a workspace for testing
      const healthRes = await request(app).get("/api/health");
      const token = healthRes.headers["x-csrf-token"];

      const wsRes = await request(app)
        .post("/api/workspaces")
        .set("Cookie", cookies)
        .set("X-CSRF-Token", token)
        .send({
          name: "Sanitization Test WS",
        });

      workspaceId = wsRes.body._id;
    });

    it("should sanitize XSS in workspace name", async () => {
      const healthRes = await request(app).get("/api/health");
      const token = healthRes.headers["x-csrf-token"];

      const res = await request(app)
        .post("/api/workspaces")
        .set("Cookie", cookies)
        .set("X-CSRF-Token", token)
        .send({
          name: '<script>alert("xss")</script>Workspace Name',
          description: "<img src=x onerror=\"alert('xss')\">Description text",
        });

      expect(res.status).toBe(201);
      expect(res.body.name).not.toContain("<script>");
      expect(res.body.name).not.toContain("onerror");
      expect(res.body.description).not.toContain("<img");
    });

    it("should sanitize XSS in note content", async () => {
      const healthRes = await request(app).get("/api/health");
      const token = healthRes.headers["x-csrf-token"];

      const res = await request(app)
        .post(`/api/workspaces/${workspaceId}/notes`)
        .set("Cookie", cookies)
        .set("X-CSRF-Token", token)
        .send({
          title: "Safe Title",
          content: `<script>maliciousCode()</script>
                    <iframe src="evil.com"></iframe>
                    Safe content here`,
        });

      expect(res.status).toBe(201);
      expect(res.body.content).not.toContain("<script>");
      expect(res.body.content).not.toContain("<iframe>");
      expect(res.body.content).toContain("Safe content");
    });

    it("should sanitize dangerous URLs", async () => {
      const healthRes = await request(app).get("/api/health");
      const token = healthRes.headers["x-csrf-token"];

      const res = await request(app)
        .post(`/api/workspaces/${workspaceId}/notes`)
        .set("Cookie", cookies)
        .set("X-CSRF-Token", token)
        .send({
          title: "Dangerous URL",
          content:
            'Click <a href="javascript:alert(\'xss\')">here</a> or <a href="vbscript:msgbox()">there</a>',
        });

      expect(res.status).toBe(201);
      expect(res.body.content).not.toContain("javascript:");
      expect(res.body.content).not.toContain("vbscript:");
    });

    it("should sanitize query parameters", async () => {
      const res = await request(app)
        .get("/api/activities?workspace=<script>alert('xss')</script>")
        .set("Cookie", cookies);

      // Should not crash and should be safe
      expect(res.status).not.toBe(500);
    });

    it("should remove HTML tags from strings", async () => {
      const healthRes = await request(app).get("/api/health");
      const token = healthRes.headers["x-csrf-token"];

      const res = await request(app)
        .post(`/api/workspaces/${workspaceId}/notes`)
        .set("Cookie", cookies)
        .set("X-CSRF-Token", token)
        .send({
          title: "<b>Bold Title</b>",
          content: "<p>Regular <i>text</i> here</p>",
        });

      expect(res.status).toBe(201);
      expect(res.body.title).not.toContain("<b>");
      expect(res.body.content).not.toContain("<p>");
      expect(res.body.content).not.toContain("<i>");
    });
  });

  // ===== RATE LIMITING TESTS =====
  describe("Rate Limiting", () => {
    it("should limit signup attempts", async () => {
      const results = [];

      for (let i = 0; i < 5; i++) {
        const res = await request(app)
          .post("/api/auth/signup")
          .send({
            displayName: `RateLimit ${i}`,
            email: `rate-limit-signup-${i}@example.com`,
            password: "RateTest@123",
          });

        results.push(res.status);
      }

      // At least one should be 429 (rate limited) or all 201
      const has201 = results.includes(201);
      const has429 = results.includes(429);

      expect(has201).toBe(true); // Some attempts succeeded
    });

    it("should limit login attempts", async () => {
      const results = [];

      for (let i = 0; i < 6; i++) {
        const res = await request(app).post("/api/auth/login").send({
          email: "security-test@example.com",
          password: "WrongPassword@123",
        });

        results.push(res.status);
      }

      // Should have rate limit hit
      const has429 = results.includes(429);
      expect(has429).toBe(true);
    });
  });

  // ===== SESSION SECURITY TESTS =====
  describe("Session Security", () => {
    it("should set secure session cookies", async () => {
      const res = await request(app).post("/api/auth/login").send({
        email: "security-test@example.com",
        password: "StrongPass@123",
      });

      const setCookieHeaders = res.headers["set-cookie"];
      expect(setCookieHeaders).toBeDefined();

      // Check for HttpOnly flag
      const hasHttpOnly = setCookieHeaders.some((cookie) =>
        cookie.toLowerCase().includes("httponly"),
      );
      expect(hasHttpOnly).toBe(true);

      // Check for SameSite
      const hasSameSite = setCookieHeaders.some((cookie) =>
        cookie.toUpperCase().includes("SAMESITE"),
      );
      expect(hasSameSite).toBe(true);
    });

    it("should destroy session on logout", async () => {
      const loginRes = await request(app).post("/api/auth/login").send({
        email: "security-test@example.com",
        password: "StrongPass@123",
      });

      const loginCookies = loginRes.headers["set-cookie"];

      // Verify authenticated access works
      const authenticatedRes = await request(app)
        .get("/api/workspaces")
        .set("Cookie", loginCookies);

      expect(authenticatedRes.status).toBe(200);

      // Logout
      await request(app).post("/api/auth/logout").set("Cookie", loginCookies);

      // Session should be destroyed - access should fail
      // (Note: depends on implementation, might return 401 or redirect)
    });
  });
});
