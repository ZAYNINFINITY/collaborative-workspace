const request = require("supertest");
const mongoose = require("mongoose");
const app = require("../server").app;
const User = require("../models/User");
const Workspace = require("../models/Workspace");

process.env.NODE_ENV = "test";

/**
 * Integration Tests: Full User Journey
 * Simulates real-world workflow end-to-end
 */
describe("End-to-End User Journey", () => {
  let user1, user2;
  let user1Cookies, user2Cookies;
  let testWorkspace;
  let csrfToken;

  beforeAll(async () => {
    if (!mongoose.connection.readyState) {
      await mongoose.connect(
        process.env.MONGODB_URI || "mongodb://localhost:27017/workspace-test",
      );
    }
  });

  afterAll(async () => {
    await User.deleteMany({ email: /e2e-/ });
    await Workspace.deleteMany({ owner: { $in: [user1?._id, user2?._id] } });
    if (mongoose.connection.readyState === 1) {
      await mongoose.connection.close();
    }
  });

  describe("Complete Workflow", () => {
    it("Step 1: User 1 creates account", async () => {
      const res = await request(app).post("/api/auth/signup").send({
        displayName: "E2E User 1",
        email: "e2e-user1@example.com",
        password: "E2EUser@123",
      });

      expect(res.status).toBe(201);
      user1 = res.body;
    });

    it("Step 2: User 1 logs in", async () => {
      const res = await request(app).post("/api/auth/login").send({
        email: "e2e-user1@example.com",
        password: "E2EUser@123",
      });

      expect(res.status).toBe(200);
      user1Cookies = res.headers["set-cookie"];
    });

    it("Step 3: User 1 creates workspace", async () => {
      const res = await request(app)
        .post("/api/workspaces")
        .set("Cookie", user1Cookies)
        .set("X-CSRF-Token", csrfToken || "temp")
        .send({
          name: "E2E Test Project",
          description: "Testing full workflow",
        });

      // First attempt might fail on CSRF if csrfToken not set
      if (res.status === 403 && res.body.msg?.includes("CSRF")) {
        // Get CSRF token and retry
        const healthRes = await request(app).get("/api/health");
        csrfToken = healthRes.headers["x-csrf-token"];

        const retryRes = await request(app)
          .post("/api/workspaces")
          .set("Cookie", user1Cookies)
          .set("X-CSRF-Token", csrfToken)
          .send({
            name: "E2E Test Project",
            description: "Testing full workflow",
          });

        expect(retryRes.status).toBe(201);
        testWorkspace = retryRes.body;
      } else {
        expect(res.status).toBe(201);
        testWorkspace = res.body;
      }
    });

    it("Step 4: User 1 adds notes to workspace", async () => {
      const res = await request(app)
        .post(`/api/workspaces/${testWorkspace._id}/notes`)
        .set("Cookie", user1Cookies)
        .set("X-CSRF-Token", csrfToken)
        .send({
          title: "Project Requirements",
          content: "1. Build feature X\n2. Test thoroughly\n3. Deploy",
        });

      expect(res.status).toBe(201);
      expect(res.body.title).toBe("Project Requirements");
    });

    it("Step 5: User 1 creates tasks", async () => {
      const res = await request(app)
        .post(`/api/workspaces/${testWorkspace._id}/tasks`)
        .set("Cookie", user1Cookies)
        .set("X-CSRF-Token", csrfToken)
        .send({
          title: "Implement feature",
          description: "Build the core feature",
          priority: "high",
          status: "todo",
        });

      expect(res.status).toBe(201);
      expect(res.body.title).toBe("Implement feature");
    });

    it("Step 6: User 2 creates account", async () => {
      const res = await request(app).post("/api/auth/signup").send({
        displayName: "E2E User 2",
        email: "e2e-user2@example.com",
        password: "E2EUser@123",
      });

      expect(res.status).toBe(201);
      user2 = res.body;
    });

    it("Step 7: User 1 invites User 2 to workspace", async () => {
      const res = await request(app)
        .post(`/api/workspaces/${testWorkspace._id}/invite`)
        .set("Cookie", user1Cookies)
        .set("X-CSRF-Token", csrfToken)
        .send({
          email: "e2e-user2@example.com",
          role: "member",
        });

      expect(res.status).toBe(200);
      expect(res.body.msg).toContain("sent");
    });

    it("Step 8: Get workspace invitations", async () => {
      const res = await request(app)
        .get(`/api/workspaces/${testWorkspace._id}/invites`)
        .set("Cookie", user1Cookies);

      expect(res.status).toBe(200);
      expect(Array.isArray(res.body)).toBe(true);
      expect(res.body.length).toBeGreaterThan(0);
    });

    it("Step 9: User 2 logs in", async () => {
      const res = await request(app).post("/api/auth/login").send({
        email: "e2e-user2@example.com",
        password: "E2EUser@123",
      });

      expect(res.status).toBe(200);
      user2Cookies = res.headers["set-cookie"];
    });

    it("Step 10: User 2 accepts invite", async () => {
      // Get invite token first
      const invitesRes = await request(app)
        .get(`/api/workspaces/${testWorkspace._id}/invites`)
        .set("Cookie", user1Cookies);

      const token = invitesRes.body[0].token;

      const res = await request(app)
        .post(`/api/workspaces/${testWorkspace._id}/invites/${token}/accept`)
        .set("Cookie", user2Cookies)
        .set("X-CSRF-Token", csrfToken);

      expect(res.status).toBe(200);
      expect(res.body.msg).toContain("member");
    });

    it("Step 11: User 2 can now access workspace", async () => {
      const res = await request(app)
        .get(`/api/workspaces/${testWorkspace._id}`)
        .set("Cookie", user2Cookies);

      expect(res.status).toBe(200);
      expect(res.body.workspace.name).toBe("E2E Test Project");
    });

    it("Step 12: User 2 adds comment to task", async () => {
      // Get first task
      const wsRes = await request(app)
        .get(`/api/workspaces/${testWorkspace._id}`)
        .set("Cookie", user2Cookies);

      const taskId = wsRes.body.tasks[0]._id;

      const res = await request(app)
        .post(`/api/workspaces/${testWorkspace._id}/tasks/${taskId}/comments`)
        .set("Cookie", user2Cookies)
        .set("X-CSRF-Token", csrfToken)
        .send({
          comment: "I'll take this task",
        });

      expect(res.status).toBe(201);
    });

    it("Step 13: User 1 updates member role", async () => {
      const res = await request(app)
        .put(`/api/workspaces/${testWorkspace._id}/members/${user2._id}`)
        .set("Cookie", user1Cookies)
        .set("X-CSRF-Token", csrfToken)
        .send({
          role: "admin",
        });

      expect(res.status).toBe(200);
      expect(res.body.newRole).toBe("admin");
    });

    it("Step 14: User 1 views activities", async () => {
      const res = await request(app)
        .get(`/api/workspaces/${testWorkspace._id}/activities`)
        .set("Cookie", user1Cookies);

      expect(res.status).toBe(200);
      expect(Array.isArray(res.body)).toBe(true);
    });

    it("Step 15: User 1 logs out", async () => {
      const res = await request(app)
        .post("/api/auth/logout")
        .set("Cookie", user1Cookies);

      expect([200, 302]).toContain(res.status);
    });

    it("Step 16: User 2 deletes workspace (as admin)", async () => {
      const res = await request(app)
        .delete(`/api/workspaces/${testWorkspace._id}`)
        .set("Cookie", user2Cookies)
        .set("X-CSRF-Token", csrfToken);

      // User 2 should not be able to delete (only owner can)
      expect(res.status).toBe(403);
    });

    it("Step 17: User 1 can re-login and delete workspace", async () => {
      // Re-login
      const loginRes = await request(app).post("/api/auth/login").send({
        email: "e2e-user1@example.com",
        password: "E2EUser@123",
      });

      const cookies = loginRes.headers["set-cookie"];

      const res = await request(app)
        .delete(`/api/workspaces/${testWorkspace._id}`)
        .set("Cookie", cookies)
        .set("X-CSRF-Token", csrfToken);

      expect(res.status).toBe(200);
      expect(res.body.msg).toContain("deleted");
    });

    it("Step 18: Workspace is deleted and inaccessible", async () => {
      const res = await request(app)
        .get(`/api/workspaces/${testWorkspace._id}`)
        .set("Cookie", user1Cookies);

      expect(res.status).toBe(404);
    });
  });

  describe("Multi-User Scenarios", () => {
    it("should handle multiple concurrent workspace creations", async () => {
      const promises = [];

      for (let i = 0; i < 3; i++) {
        promises.push(
          request(app)
            .post("/api/workspaces")
            .set("Cookie", user1Cookies)
            .set("X-CSRF-Token", csrfToken)
            .send({
              name: `Concurrent WS ${i}`,
            }),
        );
      }

      const results = await Promise.all(promises);
      const successCount = results.filter((r) => r.status === 201).length;

      expect(successCount).toBe(3);
    });

    it("should handle permission conflicts", async () => {
      // Create another user
      const user3Res = await request(app).post("/api/auth/signup").send({
        displayName: "E2E User 3",
        email: "e2e-user3@example.com",
        password: "E2EUser@123",
      });

      const user3Cookies = (
        await request(app).post("/api/auth/login").send({
          email: "e2e-user3@example.com",
          password: "E2EUser@123",
        })
      ).headers["set-cookie"];

      // Create workspace with user1
      const wsRes = await request(app)
        .post("/api/workspaces")
        .set("Cookie", user1Cookies)
        .set("X-CSRF-Token", csrfToken)
        .send({
          name: "Permission Test WS",
        });

      const workspaceId = wsRes.body._id;

      // User3 tries to delete workspace they don't own
      const deleteRes = await request(app)
        .delete(`/api/workspaces/${workspaceId}`)
        .set("Cookie", user3Cookies)
        .set("X-CSRF-Token", csrfToken);

      expect(deleteRes.status).toBe(403);

      // Cleanup
      await User.deleteOne({ email: "e2e-user3@example.com" });
    });
  });
});
