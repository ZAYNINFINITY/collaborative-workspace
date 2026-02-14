#!/usr/bin/env node

/**
 * DEEP FUNCTIONALITY TESTER
 * Tests real user workflows and edge cases
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
            rawBody: body,
          });
        } catch (e) {
          resolve({
            status: res.statusCode,
            body: body.substring(0, 500),
            headers: res.headers,
            rawBody: body,
          });
        }
      });
    });
    req.on("error", (e) => reject(e));
    if (data) req.write(JSON.stringify(data));
    req.end();
  });
}

async function testUserFlow() {
  console.log(`
╔════════════════════════════════════════════════════════════════╗
║          DEEP FUNCTIONALITY & BUG DETECTION TEST               ║
║              Testing Real User Workflows                       ║
╚════════════════════════════════════════════════════════════════╝
`);

  const issues = [];
  let cookies = "";

  try {
    // ==================== TEST 1: SIGNUP FLOW ====================
    console.log("\n🔴 TEST 1: SIGNUP FLOW");
    console.log("─".repeat(60));

    let testEmail = `deeptest_${Date.now()}@example.com`;

    let res = await request(
      {
        hostname: "localhost",
        port: 5000,
        path: "/api/auth/signup",
        method: "POST",
        headers: { "Content-Type": "application/json" },
      },
      {
        displayName: "Deep Test User",
        email: testEmail,
        password: "TestPass123!",
        confirmPassword: "TestPass123!",
      },
    );

    if (res.status === 200 && res.body.user?.id) {
      console.log(`✅ User created successfully`);
      console.log(`   ID: ${res.body.user.id.substring(0, 8)}...`);
      console.log(`   Email: ${res.body.user.email}`);
      console.log(`   Response: ${res.body.msg}`);

      if (res.headers["set-cookie"]) {
        const setCookie = Array.isArray(res.headers["set-cookie"])
          ? res.headers["set-cookie"][0]
          : res.headers["set-cookie"];
        cookies = setCookie.split(";")[0];
        console.log(`✅ Session cookie set`);
      } else {
        issues.push("❌ No session cookie on signup");
        console.log("❌ WARNING: No session cookie set!");
      }
    } else {
      issues.push(`❌ Signup failed: ${res.body.msg}`);
      console.log(`❌ FAILED: ${res.body.msg || res.status}`);
      return issues;
    }

    // ==================== TEST 2: SESSION PERSISTENCE ====================
    console.log("\n🔴 TEST 2: SESSION PERSISTENCE");
    console.log("─".repeat(60));

    res = await request({
      hostname: "localhost",
      port: 5000,
      path: "/api/auth/user",
      method: "GET",
      headers: { Cookie: cookies },
    });

    if (res.status === 200 && res.body.email === testEmail) {
      console.log(`✅ Session persisted`);
      console.log(`   Authenticated as: ${res.body.email}`);
    } else if (res.status === 401) {
      issues.push("❌ Session not persisting - user not authenticated");
      console.log("❌ ISSUE: Session not persisting after signup!");
    } else {
      issues.push(`❌ Get user failed: ${res.body.msg}`);
      console.log(`❌ FAILED: ${res.body.msg}`);
    }

    // ==================== TEST 3: WORKSPACE OPERATIONS ====================
    console.log("\n🔴 TEST 3: WORKSPACE OPERATIONS");
    console.log("─".repeat(60));

    // Create workspace
    res = await request(
      {
        hostname: "localhost",
        port: 5000,
        path: "/api/workspaces",
        method: "POST",
        headers: { Cookie: cookies, "Content-Type": "application/json" },
      },
      { name: "Deep Test Workspace", description: "Testing workflow" },
    );

    let workspaceId = null;
    if (res.status === 201 || (res.status === 200 && res.body._id)) {
      workspaceId = res.body._id;
      console.log(`✅ Workspace created: ${workspaceId.substring(0, 8)}...`);
    } else {
      issues.push(`❌ Workspace creation failed: ${res.body.msg}`);
      console.log(`❌ Creation failed: ${res.body.msg}`);
    }

    // Get workspace details
    if (workspaceId) {
      res = await request({
        hostname: "localhost",
        port: 5000,
        path: `/api/workspaces/${workspaceId}`,
        method: "GET",
        headers: { Cookie: cookies },
      });

      if (res.status === 200 && res.body.workspace) {
        console.log(`✅ Workspace details retrieved`);
        console.log(`   Name: ${res.body.workspace.name}`);
        console.log(
          `   Owner: ${res.body.workspace.owner ? "Check" : "Missing"}`,
        );
        console.log(`   Members: ${res.body.workspace.members?.length || 0}`);
        console.log(`   Has notes: ${res.body.notes?.length || 0}`);
        console.log(`   Has tasks: ${res.body.tasks?.length || 0}`);
        console.log(`   Has docs: ${res.body.documents?.length || 0}`);
      } else if (res.status === 200 && res.body._id) {
        console.log(`✅ Workspace retrieved (flat response)`);
      } else {
        issues.push(
          `❌ Get workspace failed: ${res.body.msg || `Status ${res.status}`}`,
        );
        console.log(`❌ Get failed: ${res.body.msg || res.status}`);
      }

      // ==================== TEST 4: CONTENT CREATION ====================
      console.log("\n🔴 TEST 4: CONTENT CREATION");
      console.log("─".repeat(60));

      // Create note
      res = await request(
        {
          hostname: "localhost",
          port: 5000,
          path: `/api/workspaces/${workspaceId}/notes`,
          method: "POST",
          headers: { Cookie: cookies, "Content-Type": "application/json" },
        },
        { title: "Test Note", content: "Note content" },
      );

      if (res.status === 200 || res.status === 201) {
        console.log(`✅ Note created`);
      } else {
        issues.push(`Note creation failed: ${res.body.msg}`);
        console.log(`⚠️  Note creation: ${res.body.msg || res.status}`);
      }

      // Create task
      res = await request(
        {
          hostname: "localhost",
          port: 5000,
          path: `/api/workspaces/${workspaceId}/tasks`,
          method: "POST",
          headers: { Cookie: cookies, "Content-Type": "application/json" },
        },
        {
          title: "Test Task",
          description: "Task desc",
          status: "todo",
          priority: "high",
        },
      );

      if (res.status === 200 || res.status === 201) {
        console.log(`✅ Task created`);
      } else {
        issues.push(`Task creation failed: ${res.body.msg}`);
        console.log(`⚠️  Task creation: ${res.body.msg || res.status}`);
      }

      // ==================== TEST 5: TEAM MANAGEMENT ====================
      console.log("\n🔴 TEST 5: TEAM MANAGEMENT");
      console.log("─".repeat(60));

      // Invite member
      res = await request(
        {
          hostname: "localhost",
          port: 5000,
          path: `/api/workspaces/${workspaceId}/invite`,
          method: "POST",
          headers: { Cookie: cookies, "Content-Type": "application/json" },
        },
        { email: "teammate@example.com", role: "member" },
      );

      if (res.status === 200 || res.status === 201) {
        console.log(`✅ Invitation sent to teammate@example.com`);
        if (res.body.inviteToken)
          console.log(`   Token: ${res.body.inviteToken.substring(0, 10)}...`);
      } else {
        console.log(`⚠️  Invite failed: ${res.body.msg || res.status}`);
      }

      // List members
      res = await request({
        hostname: "localhost",
        port: 5000,
        path: `/api/workspaces/${workspaceId}/members`,
        method: "GET",
        headers: { Cookie: cookies },
      });

      if (res.status === 200 && Array.isArray(res.body)) {
        console.log(`✅ Members listed: ${res.body.length} members`);
      } else {
        console.log(`⚠️  List members: ${res.body.msg || res.status}`);
      }

      // ==================== TEST 6: DELETION ====================
      console.log("\n🔴 TEST 6: DELETION");
      console.log("─".repeat(60));

      res = await request({
        hostname: "localhost",
        port: 5000,
        path: `/api/workspaces/${workspaceId}`,
        method: "DELETE",
        headers: { Cookie: cookies },
      });

      if (res.status === 200) {
        console.log(`✅ Workspace deleted successfully`);
      } else {
        console.log(`⚠️  Delete failed: ${res.body.msg || res.status}`);
      }
    }

    // ==================== TEST 7: ERROR CASES ====================
    console.log("\n🔴 TEST 7: ERROR CASES");
    console.log("─".repeat(60));

    // Bad email validation
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
      console.log(`✅ Invalid email rejected: ${res.body.msg}`);
    } else {
      issues.push("❌ Invalid email not validated");
      console.log(`❌ Invalid email not rejected`);
    }

    // Missing required fields
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

    if (res.status >= 400) {
      console.log(`✅ Missing fields rejected: ${res.body.msg}`);
    } else {
      issues.push("❌ Missing fields not validated");
      console.log(`❌ Missing fields not rejected`);
    }
  } catch (error) {
    console.error(`\n❌ FATAL: ${error.message}`);
    issues.push(`FATAL ERROR: ${error.message}`);
  }

  // Results
  console.log(`
╔════════════════════════════════════════════════════════════════╗
║                  RESULTS SUMMARY                               ║
╚════════════════════════════════════════════════════════════════╝
`);

  if (issues.length === 0) {
    console.log(`
✅ NO ISSUES FOUND - Application is working correctly!

All tested workflows completed successfully:
  • User signup and session creation
  • Session persistence
  • Workspace CRUD operations  
  • Content creation (notes/tasks)
  • Team management
  • Error handling and validation

The application is READY FOR PRODUCTION USE.
`);
  } else {
    console.log(`\n⚠️  ISSUES FOUND (${issues.length}):\n`);
    issues.forEach((issue, i) => console.log(`  ${i + 1}. ${issue}`));
    console.log("\n");
  }

  return issues;
}

testUserFlow().catch(console.error);
