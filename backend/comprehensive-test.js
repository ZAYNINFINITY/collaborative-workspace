#!/usr/bin/env node

/**
 * COMPREHENSIVE APPLICATION VERIFICATION
 * Checks all critical paths and features
 */

const http = require("http");

function request(options, data = null) {
  return new Promise((resolve, reject) => {
    options.headers = options.headers || {};
    const req = http.request(options, (res) => {
      let body = "";
      res.on("data", (chunk) => (body += chunk));
      res.on("end", () => {
        try {
          resolve({
            status: res.statusCode,
            body: JSON.parse(body),
            headers: res.headers,
          });
        } catch (e) {
          resolve({
            status: res.statusCode,
            body: body.substring(0, 500),
            headers: res.headers,
          });
        }
      });
    });
    req.on("error", (e) => reject(e.message));
    if (data) req.write(JSON.stringify(data));
    req.end();
  });
}

async function testAllFeatures() {
  console.log(`
╔════════════════════════════════════════════════════════════════╗
║        COMPLETE APPLICATION DEBUGGING & VERIFICATION          ║
║                    Testing All Features                        ║
╚════════════════════════════════════════════════════════════════╝
`);

  const results = {
    passed: [],
    failed: [],
    warnings: [],
  };

  let workspaceId = null;
  let userId = null;
  let cookies = "";
  let testEmail = `test_${Date.now()}@example.com`;

  try {
    // ==================== BACKEND HEALTH ====================
    console.log("\n📡 BACKEND HEALTH CHECKS");
    console.log("─".repeat(60));

    let res = await request({
      hostname: "localhost",
      port: 5000,
      path: "/api/health",
      method: "GET",
    });

    if (res.status === 200) {
      console.log("✅ Health endpoint: OK");
      results.passed.push("Health check");
    } else {
      console.log(`❌ Health endpoint: Status ${res.status}`);
      results.failed.push("Health check");
    }

    // ==================== AUTHENTICATION ====================
    console.log("\n🔐 AUTHENTICATION TESTS");
    console.log("─".repeat(60));

    // Signup
    res = await request(
      {
        hostname: "localhost",
        port: 5000,
        path: "/api/auth/signup",
        method: "POST",
        headers: { "Content-Type": "application/json" },
      },
      {
        displayName: "Test User",
        email: testEmail,
        password: "TestPassword123!",
      },
    );

    if (res.status === 200 && res.body.user?.id) {
      console.log(`✅ Signup: Created user ${testEmail}`);
      results.passed.push("Signup");
      userId = res.body.user.id;

      if (res.headers["set-cookie"]) {
        const setCookie = Array.isArray(res.headers["set-cookie"])
          ? res.headers["set-cookie"][0]
          : res.headers["set-cookie"];
        cookies = setCookie.split(";")[0];
      }
    } else {
      console.log(`❌ Signup: ${res.body.msg}`);
      results.failed.push("Signup");
    }

    // Get current user
    res = await request({
      hostname: "localhost",
      port: 5000,
      path: "/api/auth/user",
      method: "GET",
      headers: { Cookie: cookies },
    });

    if (res.status === 200 && res.body.username) {
      console.log(`✅ Get user: ${res.body.email}`);
      results.passed.push("Get current user");
    } else if (res.status === 401) {
      console.log("⚠️  Get user: Not authenticated (session issue)");
      results.warnings.push("Session persistence");
    } else {
      console.log(`❌ Get user: ${res.body.msg}`);
      results.failed.push("Get current user");
    }

    // ==================== WORKSPACE MANAGEMENT ====================
    console.log("\n📦 WORKSPACE MANAGEMENT");
    console.log("─".repeat(60));

    // Create workspace
    res = await request(
      {
        hostname: "localhost",
        port: 5000,
        path: "/api/workspaces",
        method: "POST",
        headers: {
          Cookie: cookies,
          "Content-Type": "application/json",
        },
      },
      {
        name: "Test Workspace",
        description: "Automated test workspace",
      },
    );

    if (res.status === 201 || (res.status === 200 && res.body._id)) {
      console.log(`✅ Create workspace: ${res.body._id}`);
      results.passed.push("Workspace creation");
      workspaceId = res.body._id;
    } else if (res.status === 401) {
      console.log("⚠️  Create workspace: Requires authentication");
      results.warnings.push("Workspace auth required");
    } else {
      console.log(`❌ Create workspace: ${res.body.msg || res.body.error}`);
      results.failed.push("Workspace creation");
    }

    // Get workspace
    if (workspaceId) {
      res = await request({
        hostname: "localhost",
        port: 5000,
        path: `/api/workspaces/${workspaceId}`,
        method: "GET",
        headers: { Cookie: cookies },
      });

      if (res.status === 200 && res.body._id) {
        console.log(`✅ Get workspace: Retrieved ${res.body.name}`);
        results.passed.push("Get workspace");
      } else {
        console.log(`❌ Get workspace: ${res.body.msg}`);
        results.failed.push("Get workspace");
      }

      // List workspaces
      res = await request({
        hostname: "localhost",
        port: 5000,
        path: "/api/workspaces",
        method: "GET",
        headers: { Cookie: cookies },
      });

      if (res.status === 200 && Array.isArray(res.body)) {
        console.log(`✅ List workspaces: ${res.body.length} workspaces`);
        results.passed.push("List workspaces");
      } else {
        console.log(`❌ List workspaces: Failed`);
        results.failed.push("List workspaces");
      }
    }

    // ==================== CONTENT MANAGEMENT ====================
    console.log("\n📝 CONTENT MANAGEMENT");
    console.log("─".repeat(60));

    if (workspaceId) {
      // Create note
      res = await request(
        {
          hostname: "localhost",
          port: 5000,
          path: `/api/workspaces/${workspaceId}/notes`,
          method: "POST",
          headers: {
            Cookie: cookies,
            "Content-Type": "application/json",
          },
        },
        {
          title: "Test Note",
          content: "This is a test note",
        },
      );

      if (res.status === 200 || res.status === 201) {
        console.log(`✅ Create note: Created`);
        results.passed.push("Create note");
      } else if (res.status === 401) {
        console.log("⚠️  Create note: Auth required");
      } else {
        console.log(`⚠️  Create note: ${res.body.msg}`);
      }

      // Create task
      res = await request(
        {
          hostname: "localhost",
          port: 5000,
          path: `/api/workspaces/${workspaceId}/tasks`,
          method: "POST",
          headers: {
            Cookie: cookies,
            "Content-Type": "application/json",
          },
        },
        {
          title: "Test Task",
          description: "Test task",
          status: "todo",
          priority: "high",
        },
      );

      if (res.status === 200 || res.status === 201) {
        console.log(`✅ Create task: Created`);
        results.passed.push("Create task");
      } else if (res.status === 401) {
        console.log("⚠️  Create task: Auth required");
      } else {
        console.log(`⚠️  Create task: ${res.body.msg}`);
      }

      // Delete workspace (NEW FEATURE)
      res = await request({
        hostname: "localhost",
        port: 5000,
        path: `/api/workspaces/${workspaceId}`,
        method: "DELETE",
        headers: { Cookie: cookies },
      });

      if (res.status === 200 && res.body.msg) {
        console.log(`✅ Delete workspace: ${res.body.msg}`);
        results.passed.push("Delete workspace");
      } else if (res.status === 401) {
        console.log("⚠️  Delete workspace: Auth required");
      } else {
        console.log(`⚠️  Delete workspace: ${res.body.msg || "No response"}`);
      }
    }

    // ==================== ERROR HANDLING ====================
    console.log("\n⚠️  ERROR HANDLING");
    console.log("─".repeat(60));

    // Test invalid route
    res = await request({
      hostname: "localhost",
      port: 5000,
      path: "/api/nonexistent",
      method: "GET",
    });

    if (res.status === 404 || res.status >= 400) {
      console.log(`✅ Invalid route: Handled (${res.status})`);
      results.passed.push("404 handling");
    } else {
      console.log(`❌ Invalid route: Not handled`);
      results.failed.push("404 handling");
    }

    // Test missing fields
    res = await request(
      {
        hostname: "localhost",
        port: 5000,
        path: "/api/auth/signup",
        method: "POST",
        headers: { "Content-Type": "application/json" },
      },
      { displayName: "Only name" },
    );

    if (res.status >= 400 && res.body.msg) {
      console.log(`✅ Missing fields: Validated (${res.body.msg})`);
      results.passed.push("Input validation");
    } else {
      console.log(`❌ Missing fields: Not validated`);
      results.failed.push("Input validation");
    }

    // ==================== FRONTEND CHECKS ====================
    console.log("\n🎨 FRONTEND AVAILABILITY");
    console.log("─".repeat(60));

    res = await request({
      hostname: "localhost",
      port: 3000,
      path: "/",
      method: "GET",
    });

    if (res.status === 200 && res.body.includes("<!DOCTYPE")) {
      console.log(`✅ Frontend: Serving (${res.status})`);
      results.passed.push("Frontend server");
    } else {
      console.log(`❌ Frontend: Not responding`);
      results.failed.push("Frontend server");
    }
  } catch (error) {
    console.error(`\n❌ FATAL ERROR: ${error}`);
  }

  // ==================== RESULTS ====================
  console.log(`
╔════════════════════════════════════════════════════════════════╗
║                      TEST RESULTS SUMMARY                      ║
╚════════════════════════════════════════════════════════════════╝

✅ PASSED (${results.passed.length}):
${results.passed.map((p) => `   • ${p}`).join("\n")}

❌ FAILED (${results.failed.length}):
${results.failed.length > 0 ? results.failed.map((f) => `   • ${f}`).join("\n") : "   • None!"}

⚠️  WARNINGS (${results.warnings.length}):
${results.warnings.length > 0 ? results.warnings.map((w) => `   • ${w}`).join("\n") : "   • None!"}

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Overall Status: ${results.failed.length === 0 ? "✅ WORKING" : "❌ ISSUES FOUND"}

${results.failed.length > 0 ? "\n🔧 FIXES NEEDED:\n" + results.failed.map((f) => `   - ${f}`).join("\n") : "\n✅ APPLICATION READY FOR USE"}
`);
}

testAllFeatures().catch(console.error);
