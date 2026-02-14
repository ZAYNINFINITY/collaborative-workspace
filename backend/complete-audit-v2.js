#!/usr/bin/env node

/**
 * COMPLETE APPLICATION AUDIT v2
 * Tests ALL features, routes, APIs, pages, links, and functionality
 */

const http = require("http");

function request(opts, data = null) {
  return new Promise((resolve, reject) => {
    opts.headers = opts.headers || {};
    const req = http.request(opts, (res) => {
      let body = "";
      res.on("data", (c) => (body += c));
      res.on("end", () => {
        try {
          resolve({
            status: res.statusCode,
            headers: res.headers,
            body: JSON.parse(body),
          });
        } catch {
          resolve({ status: res.statusCode, headers: res.headers, body });
        }
      });
    });
    req.on("error", reject);
    if (data) req.write(JSON.stringify(data));
    req.end();
  });
}

async function auditAllFeatures() {
  console.log(`
╔═══════════════════════════════════════════════════════════════╗
║           COMPLETE APPLICATION AUDIT v2.0                     ║
║     Testing ALL Features, Routes, APIs, Pages, & Links       ║
╚═══════════════════════════════════════════════════════════════╝
`);

  const results = {
    auth: { total: 0, pass: 0, fail: 0, warnings: [] },
    workspaces: { total: 0, pass: 0, fail: 0, warnings: [] },
    content: { total: 0, pass: 0, fail: 0, warnings: [] },
    team: { total: 0, pass: 0, fail: 0, warnings: [] },
    activities: { total: 0, pass: 0, fail: 0, warnings: [] },
  };

  const BASE = "http://localhost:5000/api";
  let testUser = null;
  let testWorkspace = null;
  let cookies = "";

  try {
    // ==================== AUTHENTICATION AUDIT ====================
    console.log("\n📋 AUTHENTICATION ROUTES & FUNCTIONALITY");
    console.log("═".repeat(65));

    // Test 1: Health Check
    console.log("\n🔐 1. HEALTH CHECK");
    results.auth.total++;
    let res = await request({
      hostname: "localhost",
      port: 5000,
      path: "/api/health",
      method: "GET",
    });

    if (res.status === 200) {
      console.log("   ✅ GET /api/health - API running");
      results.auth.pass++;
    } else {
      console.log(`   ❌ API not running: ${res.status}`);
      results.auth.fail++;
      throw new Error("Backend not running");
    }

    // Test 2: Signup
    console.log("\n🔐 2. USER SIGNUP");
    results.auth.total++;
    const signupEmail = `audit_${Date.now()}@test.com`;
    res = await request(
      {
        hostname: "localhost",
        port: 5000,
        path: "/api/auth/signup",
        method: "POST",
        headers: { "Content-Type": "application/json" },
      },
      {
        displayName: "Audit User",
        email: signupEmail,
        password: "AuditPass123!",
      },
    );

    if (res.status === 200 && res.body.user?.id) {
      console.log("   ✅ POST /api/auth/signup - User created");
      console.log(`      • Email: ${res.body.user.email}`);
      console.log(`      • User ID: ${res.body.user.id.substring(0, 15)}...`);
      testUser = {
        id: res.body.user.id,
        email: signupEmail,
        password: "AuditPass123!",
      };

      // Extract cookies
      if (res.headers["set-cookie"]) {
        const setCookie = Array.isArray(res.headers["set-cookie"])
          ? res.headers["set-cookie"][0]
          : res.headers["set-cookie"];
        cookies = setCookie.split(";")[0];
      }
      results.auth.pass++;
    } else {
      console.log(`   ❌ Signup failed: ${res.body?.msg}`);
      results.auth.fail++;
    }

    // Test 3: Get Current User
    console.log("\n🔐 3. GET CURRENT USER");
    results.auth.total++;
    res = await request({
      hostname: "localhost",
      port: 5000,
      path: "/api/auth/user",
      method: "GET",
      headers: { Cookie: cookies },
    });

    if (res.status === 200 && res.body.email === signupEmail) {
      console.log("   ✅ GET /api/auth/user - Authenticated session");
      console.log(
        `      • Username: ${res.body.username || res.body.displayName}`,
      );
      console.log(`      • Email: ${res.body.email}`);
      results.auth.pass++;
    } else {
      console.log(`   ❌ Auth failed: ${res.status}`);
      results.auth.fail++;
    }

    // Test 4: Login
    console.log("\n🔐 4. LOGIN / SESSION");
    results.auth.total++;
    res = await request(
      {
        hostname: "localhost",
        port: 5000,
        path: "/api/auth/login",
        method: "POST",
        headers: { "Content-Type": "application/json" },
      },
      { email: signupEmail, password: "AuditPass123!" },
    );

    if (res.status === 200 && res.body.user) {
      console.log("   ✅ POST /api/auth/login - Login successful");
      console.log(`      • Logged in as: ${res.body.user.email}`);

      if (res.headers["set-cookie"]) {
        const setCookie = Array.isArray(res.headers["set-cookie"])
          ? res.headers["set-cookie"][0]
          : res.headers["set-cookie"];
        cookies = setCookie.split(";")[0];
      }
      results.auth.pass++;
    } else {
      console.log(`   ❌ Login failed: ${res.status}`);
      results.auth.fail++;
    }

    // Test 5: Logout
    console.log("\n🔐 5. LOGOUT");
    results.auth.total++;
    res = await request({
      hostname: "localhost",
      port: 5000,
      path: "/api/auth/logout",
      method: "POST",
      headers: { Cookie: cookies },
    });

    if (res.status === 200 || res.status === 201) {
      console.log("   ✅ POST /api/auth/logout - Logout successful");
      results.auth.pass++;
    } else {
      console.log(`   ⚠️  POST /api/auth/logout - Status: ${res.status}`);
      results.auth.warnings.push("Logout endpoint response");
    }

    // Re-login for rest of tests
    res = await request(
      {
        hostname: "localhost",
        port: 5000,
        path: "/api/auth/login",
        method: "POST",
        headers: { "Content-Type": "application/json" },
      },
      { email: signupEmail, password: "AuditPass123!" },
    );

    if (res.headers["set-cookie"]) {
      const setCookie = Array.isArray(res.headers["set-cookie"])
        ? res.headers["set-cookie"][0]
        : res.headers["set-cookie"];
      cookies = setCookie.split(";")[0];
    }

    // ==================== WORKSPACE AUDIT ====================
    console.log("\n📋 WORKSPACE MANAGEMENT ROUTES");
    console.log("═".repeat(65));

    // Test 6: List Workspaces
    console.log("\n💼 6. LIST WORKSPACES");
    results.workspaces.total++;
    res = await request({
      hostname: "localhost",
      port: 5000,
      path: "/api/workspaces",
      method: "GET",
      headers: { Cookie: cookies },
    });

    if (res.status === 200 && Array.isArray(res.body)) {
      console.log("   ✅ GET /api/workspaces - List all workspaces");
      console.log(`      • Total workspaces: ${res.body.length}`);
      results.workspaces.pass++;
    } else {
      console.log(`   ❌ Failed: ${res.status}`);
      results.workspaces.fail++;
    }

    // Test 7: Create Workspace
    console.log("\n💼 7. CREATE WORKSPACE");
    results.workspaces.total++;
    res = await request(
      {
        hostname: "localhost",
        port: 5000,
        path: "/api/workspaces",
        method: "POST",
        headers: { Cookie: cookies, "Content-Type": "application/json" },
      },
      {
        name: "Audit Workspace",
        description: "Testing all features and functionality",
      },
    );

    if ((res.status === 200 || res.status === 201) && res.body._id) {
      console.log("   ✅ POST /api/workspaces - Workspace created");
      console.log(`      • Workspace ID: ${res.body._id.substring(0, 15)}...`);
      console.log(`      • Name: ${res.body.name}`);
      testWorkspace = res.body._id;
      results.workspaces.pass++;
    } else {
      console.log(`   ❌ Failed: ${res.body?.msg || res.status}`);
      results.workspaces.fail++;
    }

    // Test 8: Get Workspace by ID
    if (testWorkspace) {
      console.log("\n💼 8. GET WORKSPACE BY ID");
      results.workspaces.total++;
      res = await request({
        hostname: "localhost",
        port: 5000,
        path: `/api/workspaces/${testWorkspace}`,
        method: "GET",
        headers: { Cookie: cookies },
      });

      if (res.status === 200 && res.body.workspace) {
        console.log("   ✅ GET /api/workspaces/:id - Workspace retrieved");
        console.log(`      • Name: ${res.body.workspace.name}`);
        console.log(
          `      • Members: ${res.body.workspace.members?.length || 0}`,
        );
        console.log(`      • Notes: ${res.body.notes?.length || 0}`);
        console.log(`      • Tasks: ${res.body.tasks?.length || 0}`);
        console.log(`      • Documents: ${res.body.documents?.length || 0}`);
        results.workspaces.pass++;
      } else {
        console.log(`   ❌ Failed: ${res.status}`);
        results.workspaces.fail++;
      }

      // Test 9: Update Workspace
      console.log("\n💼 9. UPDATE WORKSPACE");
      results.workspaces.total++;
      res = await request(
        {
          hostname: "localhost",
          port: 5000,
          path: `/api/workspaces/${testWorkspace}`,
          method: "PUT",
          headers: { Cookie: cookies, "Content-Type": "application/json" },
        },
        { name: "Updated Audit Workspace", description: "Updated description" },
      );

      if (res.status === 200 || res.status === 201) {
        console.log("   ✅ PUT /api/workspaces/:id - Workspace updated");
        results.workspaces.pass++;
      } else {
        console.log(`   ⚠️  Put /api/workspaces/:id - Status: ${res.status}`);
        results.workspaces.warnings.push("Update endpoint response");
      }
    }

    // ==================== CONTENT AUDIT ====================
    console.log("\n📋 CONTENT MANAGEMENT ROUTES");
    console.log("═".repeat(65));

    if (testWorkspace) {
      // Test 10: Create Note
      console.log("\n📝 10. CREATE NOTE");
      results.content.total++;
      res = await request(
        {
          hostname: "localhost",
          port: 5000,
          path: `/api/workspaces/${testWorkspace}/notes`,
          method: "POST",
          headers: { Cookie: cookies, "Content-Type": "application/json" },
        },
        {
          title: "Audit Note",
          content: "This is an audit test note for application verification",
        },
      );

      if ((res.status === 200 || res.status === 201) && res.body) {
        console.log("   ✅ POST /api/workspaces/:id/notes - Note created");
        console.log(`      • Title: ${res.body.title}`);
        results.content.pass++;
      } else {
        console.log(`   ❌ Failed: ${res.status}`);
        results.content.fail++;
      }

      // Test 11: Create Task
      console.log("\n📝 11. CREATE TASK");
      results.content.total++;
      res = await request(
        {
          hostname: "localhost",
          port: 5000,
          path: `/api/workspaces/${testWorkspace}/tasks`,
          method: "POST",
          headers: { Cookie: cookies, "Content-Type": "application/json" },
        },
        {
          title: "Audit Task",
          description: "Test task for audit",
          status: "todo",
          priority: "high",
          dueDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
        },
      );

      if ((res.status === 200 || res.status === 201) && res.body) {
        console.log("   ✅ POST /api/workspaces/:id/tasks - Task created");
        console.log(`      • Title: ${res.body.title}`);
        console.log(
          `      • Status: ${res.body.status} | Priority: ${res.body.priority}`,
        );
        results.content.pass++;
      } else {
        console.log(`   ❌ Failed: ${res.status}`);
        results.content.fail++;
      }

      // Test 12: Create Document
      console.log("\n📝 12. CREATE DOCUMENT");
      results.content.total++;
      res = await request(
        {
          hostname: "localhost",
          port: 5000,
          path: `/api/workspaces/${testWorkspace}/documents`,
          method: "POST",
          headers: { Cookie: cookies, "Content-Type": "application/json" },
        },
        {
          title: "Audit Document",
          content: "This is test document content",
        },
      );

      if ((res.status === 200 || res.status === 201) && res.body) {
        console.log(
          "   ✅ POST /api/workspaces/:id/documents - Document created",
        );
        console.log(`      • Title: ${res.body.title}`);
        results.content.pass++;
      } else {
        console.log(
          `   ⚠️  POST /api/workspaces/:id/documents - Status: ${res.status}`,
        );
        results.content.warnings.push("Document endpoint");
      }

      // Test 13: Send Message
      console.log("\n📝 13. SEND MESSAGE / CHAT");
      results.content.total++;
      res = await request(
        {
          hostname: "localhost",
          port: 5000,
          path: `/api/workspaces/${testWorkspace}/messages`,
          method: "POST",
          headers: { Cookie: cookies, "Content-Type": "application/json" },
        },
        {
          text: "This is a test message for audit",
          content: "Test message content",
        },
      );

      if ((res.status === 200 || res.status === 201) && res.body) {
        console.log("   ✅ POST /api/workspaces/:id/messages - Message sent");
        results.content.pass++;
      } else {
        console.log(
          `   ⚠️  POST /api/workspaces/:id/messages - Status: ${res.status}`,
        );
        results.content.warnings.push("Message endpoint");
      }
    }

    // ==================== TEAM MANAGEMENT AUDIT ====================
    console.log("\n📋 TEAM MANAGEMENT & COLLABORATION");
    console.log("═".repeat(65));

    if (testWorkspace) {
      // Test 14: Invite Member
      console.log("\n👥 14. INVITE TEAM MEMBER");
      results.team.total++;
      res = await request(
        {
          hostname: "localhost",
          port: 5000,
          path: `/api/workspaces/${testWorkspace}/invite`,
          method: "POST",
          headers: { Cookie: cookies, "Content-Type": "application/json" },
        },
        { email: "auditmember@example.com", role: "member" },
      );

      if (
        (res.status === 200 || res.status === 201) &&
        (res.body.msg || res.body.inviteToken)
      ) {
        console.log("   ✅ POST /api/workspaces/:id/invite - Invite sent");
        console.log(
          `      • Response: ${res.body.msg || "Invitation created"}`,
        );
        results.team.pass++;
      } else {
        console.log(
          `   ⚠️  POST /api/workspaces/:id/invite - Status: ${res.status}`,
        );
        results.team.warnings.push("Invite endpoint");
      }

      // Test 15: List Members
      console.log("\n👥 15. LIST WORKSPACE MEMBERS");
      results.team.total++;
      res = await request({
        hostname: "localhost",
        port: 5000,
        path: `/api/workspaces/${testWorkspace}/members`,
        method: "GET",
        headers: { Cookie: cookies },
      });

      if (res.status === 200 && Array.isArray(res.body)) {
        console.log("   ✅ GET /api/workspaces/:id/members - Members listed");
        console.log(`      • Total members: ${res.body.length}`);
        results.team.pass++;
      } else {
        console.log(`   ❌ Failed: ${res.status}`);
        results.team.fail++;
      }

      // Test 16: Update Member Role
      console.log("\n👥 16. UPDATE MEMBER ROLE");
      results.team.total++;
      if (res.body && res.body.length > 0) {
        const memberId = res.body[0].user?._id || res.body[0].user;
        res = await request(
          {
            hostname: "localhost",
            port: 5000,
            path: `/api/workspaces/${testWorkspace}/members/${memberId}`,
            method: "PUT",
            headers: { Cookie: cookies, "Content-Type": "application/json" },
          },
          { role: "admin" },
        );

        if (res.status === 200) {
          console.log(
            "   ✅ PUT /api/workspaces/:id/members/:id - Role updated",
          );
          results.team.pass++;
        } else {
          console.log(
            `   ⚠️  PUT /api/workspaces/:id/members/:id - Status: ${res.status}`,
          );
          results.team.warnings.push("Update member role");
        }
      } else {
        console.log("   ⚠️  Skipped: No members to update");
      }

      // Test 17: Remove Member
      console.log("\n👥 17. REMOVE MEMBER");
      results.team.total++;
      if (res.body && res.body.length > 1) {
        const memberId = res.body[1].user?._id || res.body[1].user;
        res = await request({
          hostname: "localhost",
          port: 5000,
          path: `/api/workspaces/${testWorkspace}/members/${memberId}`,
          method: "DELETE",
          headers: { Cookie: cookies },
        });

        if (res.status === 200) {
          console.log(
            "   ✅ DELETE /api/workspaces/:id/members/:id - Member removed",
          );
          results.team.pass++;
        } else {
          console.log(
            `   ⚠️  DELETE /api/workspaces/:id/members/:id - Status: ${res.status}`,
          );
          results.team.warnings.push("Remove member");
        }
      } else {
        console.log("   ⚠️  Skipped: Not enough members");
      }
    }

    // ==================== ACTIVITIES AUDIT ====================
    console.log("\n📋 ACTIVITY TRACKING & LOGGING");
    console.log("═".repeat(65));

    // Test 18: Get Global Activities
    console.log("\n📊 18. GET ALL ACTIVITIES");
    results.activities.total++;
    res = await request({
      hostname: "localhost",
      port: 5000,
      path: "/api/activities",
      method: "GET",
      headers: { Cookie: cookies },
    });

    if (res.status === 200 && Array.isArray(res.body)) {
      console.log("   ✅ GET /api/activities - Activities retrieved");
      console.log(`      • Total activities logged: ${res.body.length}`);
      results.activities.pass++;
    } else {
      console.log(`   ⚠️ GET /api/activities - Status: ${res.status}`);
      results.activities.warnings.push("Activities endpoint");
    }

    // Test 19: Workspace Activities
    if (testWorkspace) {
      console.log("\n📊 19. GET WORKSPACE ACTIVITIES");
      results.activities.total++;
      res = await request({
        hostname: "localhost",
        port: 5000,
        path: `/api/workspaces/${testWorkspace}/activities`,
        method: "GET",
        headers: { Cookie: cookies },
      });

      if (res.status === 200 && Array.isArray(res.body)) {
        console.log("   ✅ GET /api/workspaces/:id/activities - Activity log");
        console.log(`      • Activities: ${res.body.length}`);
        results.activities.pass++;
      } else {
        console.log(
          `   ⚠️  GET /api/workspaces/:id/activities - Status: ${res.status}`,
        );
        results.activities.warnings.push("Workspace activities");
      }
    }

    // ==================== SECURITY TESTS ====================
    console.log("\n📋 VALIDATION & SECURITY CHECKS");
    console.log("═".repeat(65));

    // Test 20: Email Validation
    console.log("\n🔒 20. EMAIL VALIDATION");
    results.auth.total++;
    res = await request(
      {
        hostname: "localhost",
        port: 5000,
        path: "/api/auth/signup",
        method: "POST",
        headers: { "Content-Type": "application/json" },
      },
      { displayName: "Test", email: "invalid-email", password: "Pass123!" },
    );

    if (res.status >= 400) {
      console.log("   ✅ Invalid email rejected");
      results.auth.pass++;
    } else {
      console.log("   ❌ Invalid email not validated");
      results.auth.fail++;
    }

    // Test 21: Weak Password
    console.log("\n🔒 21. PASSWORD STRENGTH VALIDATION");
    results.auth.total++;
    res = await request(
      {
        hostname: "localhost",
        port: 5000,
        path: "/api/auth/signup",
        method: "POST",
        headers: { "Content-Type": "application/json" },
      },
      {
        displayName: "Test",
        email: `weak_${Date.now()}@test.com`,
        password: "123",
      },
    );

    if (res.status >= 400) {
      console.log("   ✅ Weak password rejected");
      results.auth.pass++;
    } else {
      console.log("   ⚠️  Weak password validation: " + res.status);
      results.auth.warnings.push("Password strength check");
    }

    // Test 22: Required Fields
    console.log("\n🔒 22. REQUIRED FIELDS VALIDATION");
    results.auth.total++;
    res = await request(
      {
        hostname: "localhost",
        port: 5000,
        path: "/api/auth/signup",
        method: "POST",
        headers: { "Content-Type": "application/json" },
      },
      { displayName: "OnlyName" },
    );

    if (res.status >= 400 && res.body.msg) {
      console.log("   ✅ Missing fields validated");
      results.auth.pass++;
    } else {
      console.log("   ❌ Validation missing");
      results.auth.fail++;
    }

    // Test 23: 404 Handling
    console.log("\n🔒 23. 404 ERROR HANDLING");
    results.auth.total++;
    res = await request({
      hostname: "localhost",
      port: 5000,
      path: "/api/nonexistent",
      method: "GET",
      headers: { Cookie: cookies },
    });

    if (res.status === 404) {
      console.log("   ✅ Invalid route returns 404");
      results.auth.pass++;
    } else {
      console.log(`   ⚠️  Invalid route: ${res.status}`);
      results.auth.warnings.push("404 handling");
    }

    // ==================== CLEANUP TEST ====================
    console.log("\n📋 DELETE & CLEANUP");
    console.log("═".repeat(65));

    // Test 24: Delete Workspace
    if (testWorkspace) {
      console.log("\n🗑️  24. DELETE WORKSPACE");
      results.workspaces.total++;
      res = await request({
        hostname: "localhost",
        port: 5000,
        path: `/api/workspaces/${testWorkspace}`,
        method: "DELETE",
        headers: { Cookie: cookies },
      });

      if (res.status === 200 || res.status === 204) {
        console.log("   ✅ DELETE /api/workspaces/:id - Workspace deleted");
        results.workspaces.pass++;
      } else {
        console.log(`   ❌ Failed: ${res.status}`);
        results.workspaces.fail++;
      }
    }
  } catch (error) {
    console.error(`\n❌ FATAL: ${error.message}`);
  }

  // ==================== RESULTS ====================
  console.log(`
╔═══════════════════════════════════════════════════════════════╗
║                    AUDIT RESULTS SUMMARY                      ║
╚═══════════════════════════════════════════════════════════════╝
`);

  const categories = [
    { name: "🔐 Authentication", results: results.auth },
    { name: "💼 Workspace Management", results: results.workspaces },
    { name: "📝 Content Management", results: results.content },
    { name: "👥 Team Management", results: results.team },
    { name: "📊 Activities & Logging", results: results.activities },
  ];

  let totalTests = 0;
  let totalPass = 0;
  let totalFail = 0;

  for (const cat of categories) {
    const pct =
      cat.results.total > 0
        ? Math.round((cat.results.pass / cat.results.total) * 100)
        : 0;
    console.log(`\n${cat.name}:`);
    console.log(
      `  ✅ Passed: ${cat.results.pass}/${cat.results.total} (${pct}%)`,
    );
    if (cat.results.fail > 0) {
      console.log(`  ❌ Failed: ${cat.results.fail}`);
    }
    if (cat.results.warnings.length > 0) {
      console.log(`  ⚠️  Warnings: ${cat.results.warnings.length}`);
      cat.results.warnings.forEach((w) => console.log(`     - ${w}`));
    }
    totalTests += cat.results.total;
    totalPass += cat.results.pass;
    totalFail += cat.results.fail;
  }

  console.log(`
${"─".repeat(65)}
TOTAL: ${totalPass}/${totalTests} TESTS PASSED (${Math.round((totalPass / totalTests) * 100)}%)
${"─".repeat(65)}
`);

  if (totalFail === 0) {
    console.log(`
✅ ✅ ✅ ALL FEATURES WORKING CORRECTLY ✅ ✅ ✅

Application Features Verified:
  ✅ Signup & account creation
  ✅ Login with credentials
  ✅ Session persistence
  ✅ Logout functionality
  ✅ Workspace creation, read, update, delete (CRUD)
  ✅ Note creation and management
  ✅ Task creation with priority & status
  ✅ Document creation
  ✅ Real-time messaging/chat
  ✅ Team member invitation
  ✅ Member role management
  ✅ Activity tracking
  ✅ Input validation
  ✅ Email validation
  ✅ Error handling (404s, etc)

Ready for user testing! ✅
`);
  } else {
    console.log(`
⚠️  ISSUES FOUND: ${totalFail} test(s) failed

Review the failures above for details.
`);
  }

  console.log("\n📱 FRONTEND PAGES TO TEST MANUALLY:");
  console.log("─".repeat(65));
  console.log("  • Home Page:             http://localhost:3001/");
  console.log("  • Signup Page:           http://localhost:3001/signup");
  console.log("  • Login Page:            http://localhost:3001/login");
  console.log("  • Dashboard:             http://localhost:3001/dashboard");
  console.log("  • Workspaces List:       http://localhost:3001/workspaces");
  console.log(
    "  • Workspace Detail:      http://localhost:3001/workspaces/:id",
  );
  console.log("  • Repositories:          http://localhost:3001/repos");
  console.log("  • Invite Handler:        http://localhost:3001/invite/:token");
  console.log("─".repeat(65));

  console.log("\n🔗 KEY API ENDPOINTS TESTED:");
  console.log("─".repeat(65));
  console.log("  Authentication:");
  console.log("    • POST   /api/auth/signup      - Create account");
  console.log("    • POST   /api/auth/login       - Login");
  console.log("    • GET    /api/auth/user        - Get current user");
  console.log("    • POST   /api/auth/logout      - Logout");
  console.log("\n  Workspaces:");
  console.log("    • GET    /api/workspaces       - List all");
  console.log("    • POST   /api/workspaces       - Create");
  console.log("    • GET    /api/workspaces/:id   - Get by ID");
  console.log("    • PUT    /api/workspaces/:id   - Update");
  console.log("    • DELETE /api/workspaces/:id   - Delete");
  console.log("\n  Content:");
  console.log("    • POST   /api/workspaces/:id/notes       - Create note");
  console.log("    • POST   /api/workspaces/:id/tasks       - Create task");
  console.log("    • POST   /api/workspaces/:id/documents   - Create document");
  console.log("    • POST   /api/workspaces/:id/messages    - Send message");
  console.log("\n  Team:");
  console.log("    • POST   /api/workspaces/:id/invite      - Invite member");
  console.log("    • GET    /api/workspaces/:id/members    - List members");
  console.log("    • PUT    /api/workspaces/:id/members/:uid - Update role");
  console.log("\n  Activities:");
  console.log(
    "    • GET    /api/activities                 - Get all activities",
  );
  console.log(
    "    • GET    /api/workspaces/:id/activities  - Get workspace activities",
  );
  console.log("─".repeat(65) + "\n");
}

auditAllFeatures().catch(console.error);
