const request = require("supertest");
const mongoose = require("mongoose");
const app = require("../server").app;
const User = require("../models/User");
const Workspace = require("../models/Workspace");
const Note = require("../models/Note");

process.env.NODE_ENV = "test";

describe("Workspace Management", () => {
  let testUser;
  let testWorkspace;
  let authToken;
  let cookies;

  beforeAll(async () => {
    if (!mongoose.connection.readyState) {
      await mongoose.connect(
        process.env.MONGODB_URI || "mongodb://localhost:27017/workspace-test",
      );
    }

    // Create test user
    const userRes = await request(app).post("/api/auth/signup").send({
      displayName: "WS Test User",
      email: "ws-test@example.com",
      password: "TestPass@123",
    });

    testUser = userRes.body;

    // Login to get session
    const loginRes = await request(app).post("/api/auth/login").send({
      email: "ws-test@example.com",
      password: "TestPass@123",
    });

    cookies = loginRes.headers["set-cookie"];
  });

  afterAll(async () => {
    await User.deleteMany({ email: /ws-test/ });
    await Workspace.deleteMany({ owner: testUser._id });
    await Note.deleteMany({ author: testUser._id });
    if (mongoose.connection.readyState === 1) {
      await mongoose.connection.close();
    }
  });

  // ===== CREATE WORKSPACE =====
  describe("POST /api/workspaces", () => {
    it("should create a workspace with valid data", async () => {
      const res = await request(app)
        .post("/api/workspaces")
        .set("Cookie", cookies)
        .send({
          name: "Test Workspace",
          description: "A test workspace",
        });

      expect(res.status).toBe(201);
      expect(res.body.name).toBe("Test Workspace");
      expect(res.body.owner).toBe(testUser._id.toString());
      expect(res.body.members.length).toBeGreaterThan(0);
      testWorkspace = res.body;
    });

    it("should reject creation without authentication", async () => {
      const res = await request(app).post("/api/workspaces").send({
        name: "Unauthorized WS",
      });

      expect(res.status).toBe(401);
    });

    it("should reject missing workspace name", async () => {
      const res = await request(app)
        .post("/api/workspaces")
        .set("Cookie", cookies)
        .send({
          description: "No name provided",
        });

      expect(res.status).toBe(400);
      expect(res.body.msg).toContain("required");
    });

    it("should sanitize workspace name from XSS", async () => {
      const res = await request(app)
        .post("/api/workspaces")
        .set("Cookie", cookies)
        .send({
          name: '<script>alert("xss")</script>Safe Name',
          description: "XSS test",
        });

      expect(res.status).toBe(201);
      // Name should be sanitized (script tags removed)
      expect(res.body.name).not.toContain("<script>");
    });
  });

  // ===== LIST WORKSPACES =====
  describe("GET /api/workspaces", () => {
    it("should list user's workspaces", async () => {
      const res = await request(app)
        .get("/api/workspaces")
        .set("Cookie", cookies);

      expect(res.status).toBe(200);
      expect(Array.isArray(res.body)).toBe(true);
      expect(res.body.length).toBeGreaterThan(0);
      expect(res.body[0].currentUserRole).toBeDefined();
    });

    it("should reject unauthenticated list request", async () => {
      const res = await request(app).get("/api/workspaces");

      expect(res.status).toBe(401);
    });
  });

  // ===== GET WORKSPACE =====
  describe("GET /api/workspaces/:id", () => {
    it("should get workspace details", async () => {
      const res = await request(app)
        .get(`/api/workspaces/${testWorkspace._id}`)
        .set("Cookie", cookies);

      expect(res.status).toBe(200);
      expect(res.body.workspace.name).toBe(testWorkspace.name);
      expect(res.body.notes).toBeDefined();
      expect(res.body.tasks).toBeDefined();
      expect(res.body.messages).toBeDefined();
      expect(res.body.documents).toBeDefined();
    });

    it("should reject non-member access", async () => {
      // Create another user
      const otherUserRes = await request(app).post("/api/auth/signup").send({
        displayName: "Other User",
        email: "other-ws@example.com",
        password: "OtherPass@123",
      });

      const otherUserCookies = (
        await request(app).post("/api/auth/login").send({
          email: "other-ws@example.com",
          password: "OtherPass@123",
        })
      ).headers["set-cookie"];

      const res = await request(app)
        .get(`/api/workspaces/${testWorkspace._id}`)
        .set("Cookie", otherUserCookies);

      expect(res.status).toBe(403);

      // Cleanup
      await User.deleteOne({ email: "other-ws@example.com" });
    });
  });

  // ===== UPDATE WORKSPACE =====
  describe("PUT /api/workspaces/:id", () => {
    it("should update workspace name", async () => {
      const res = await request(app)
        .put(`/api/workspaces/${testWorkspace._id}`)
        .set("Cookie", cookies)
        .send({
          name: "Updated Workspace Name",
        });

      expect(res.status).toBe(200);
      expect(res.body.name).toBe("Updated Workspace Name");
    });

    it("should reject non-admin updates", async () => {
      // Create non-admin user
      const memberRes = await request(app).post("/api/auth/signup").send({
        displayName: "Member User",
        email: "member-ws@example.com",
        password: "MemberPass@123",
      });

      const memberCookies = (
        await request(app).post("/api/auth/login").send({
          email: "member-ws@example.com",
          password: "MemberPass@123",
        })
      ).headers["set-cookie"];

      // Add member to workspace
      await Workspace.findByIdAndUpdate(testWorkspace._id, {
        $push: { members: { user: memberRes.body._id, role: "member" } },
      });

      const res = await request(app)
        .put(`/api/workspaces/${testWorkspace._id}`)
        .set("Cookie", memberCookies)
        .send({
          name: "Unauthorized Update",
        });

      expect(res.status).toBe(403);

      // Cleanup
      await User.deleteOne({ email: "member-ws@example.com" });
    });
  });

  // ===== NOTES CRUD =====
  describe("Notes CRUD Operations", () => {
    let createdNote;

    it("should create a note with title", async () => {
      const res = await request(app)
        .post(`/api/workspaces/${testWorkspace._id}/notes`)
        .set("Cookie", cookies)
        .send({
          title: "My Test Note",
          content: "This is the note content",
        });

      expect(res.status).toBe(201);
      expect(res.body.title).toBe("My Test Note");
      expect(res.body.content).toBe("This is the note content");
      expect(res.body.author).toBeDefined();
      createdNote = res.body;
    });

    it("should update note title and content", async () => {
      const res = await request(app)
        .put(`/api/workspaces/${testWorkspace._id}/notes/${createdNote._id}`)
        .set("Cookie", cookies)
        .send({
          title: "Updated Title",
          content: "Updated content",
        });

      expect(res.status).toBe(200);
      expect(res.body.title).toBe("Updated Title");
      expect(res.body.content).toBe("Updated content");
    });

    it("should delete note", async () => {
      const res = await request(app)
        .delete(`/api/workspaces/${testWorkspace._id}/notes/${createdNote._id}`)
        .set("Cookie", cookies);

      expect(res.status).toBe(200);
      expect(res.body.msg).toContain("deleted");
    });

    it("should sanitize note content from XSS", async () => {
      const res = await request(app)
        .post(`/api/workspaces/${testWorkspace._id}/notes`)
        .set("Cookie", cookies)
        .send({
          title: "XSS Test",
          content: '<script>alert("xss")</script>Safe content',
        });

      expect(res.status).toBe(201);
      expect(res.body.content).not.toContain("<script>");
    });
  });

  // ===== DELETE WORKSPACE =====
  describe("DELETE /api/workspaces/:id", () => {
    it("should delete workspace and cascade deletes", async () => {
      // Create a new workspace to delete
      const createRes = await request(app)
        .post("/api/workspaces")
        .set("Cookie", cookies)
        .send({
          name: "Workspace to Delete",
        });

      const wsToDelete = createRes.body._id;

      // Add a note to it
      await request(app)
        .post(`/api/workspaces/${wsToDelete}/notes`)
        .set("Cookie", cookies)
        .send({
          title: "Note to be deleted",
          content: "Will be cascaded",
        });

      // Delete workspace
      const deleteRes = await request(app)
        .delete(`/api/workspaces/${wsToDelete}`)
        .set("Cookie", cookies);

      expect(deleteRes.status).toBe(200);
      expect(deleteRes.body.msg).toContain("deleted");

      // Verify workspace is deleted
      const getRes = await request(app)
        .get(`/api/workspaces/${wsToDelete}`)
        .set("Cookie", cookies);

      expect(getRes.status).toBe(404);
    });

    it("should reject non-owner deletion", async () => {
      // Create member
      const memberRes = await request(app).post("/api/auth/signup").send({
        displayName: "Member",
        email: "member2-ws@example.com",
        password: "MemberPass@123",
      });

      const memberCookies = (
        await request(app).post("/api/auth/login").send({
          email: "member2-ws@example.com",
          password: "MemberPass@123",
        })
      ).headers["set-cookie"];

      // Add member to workspace
      await Workspace.findByIdAndUpdate(testWorkspace._id, {
        $push: { members: { user: memberRes.body._id, role: "member" } },
      });

      const res = await request(app)
        .delete(`/api/workspaces/${testWorkspace._id}`)
        .set("Cookie", memberCookies);

      expect(res.status).toBe(403);

      // Cleanup
      await User.deleteOne({ email: "member2-ws@example.com" });
    });
  });
});
