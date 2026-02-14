#!/usr/bin/env node

/**
 * INTERACTIVE BUG FINDER
 * Checks all known potential issues and generates report
 */

const http = require("http");
const fs = require("fs");
const path = require("path");

function request(opts, data = null) {
  return new Promise((resolve, reject) => {
    opts.headers = opts.headers || {};
    const req = http.request(opts, (res) => {
      let body = "";
      res.on("data", (c) => (body += c));
      res.on("end", () => {
        try {
          resolve({ status: res.statusCode, body: JSON.parse(body) });
        } catch {
          resolve({ status: res.statusCode, body });
        }
      });
    });
    req.on("error", reject);
    if (data) req.write(JSON.stringify(data));
    req.end();
  });
}

async function findAllBugs() {
  console.log(`
╔════════════════════════════════════════════════════════════════╗
║              INTERACTIVE BUG FINDER v2.0                       ║
║           Finding ALL potential issues in real-time            ║
╚════════════════════════════════════════════════════════════════╝
`);

  const problems = [];

  try {
    // Check 1: File existence
    console.log("\n🔍 CHECK 1: File & Asset Existence");
    console.log("─".repeat(60));

    const requiredFiles = [
      "d:\\collaborative-workspace\\frontend\\src\\assets\\collab-logo.png",
      "d:\\collaborative-workspace\\backend\\server.js",
      "d:\\collaborative-workspace\\backend\\package.json",
      "d:\\collaborative-workspace\\frontend\\package.json",
    ];

    for (const file of requiredFiles) {
      if (fs.existsSync(file)) {
        console.log(`✅ ${path.basename(file)} exists`);
      } else {
        const issue = `❌ Missing: ${file}`;
        console.log(issue);
        problems.push(issue);
      }
    }

    // Check 2: Backend connectivity
    console.log("\n🔍 CHECK 2: Backend Connectivity");
    console.log("─".repeat(60));

    try {
      const res = await request({
        hostname: "localhost",
        port: 5000,
        path: "/",
        method: "GET",
      });
      console.log(`✅ Backend responding on port 5000 (status: ${res.status})`);
    } catch (e) {
      const issue = `❌ Backend NOT responding - ${e.message}`;
      console.log(issue);
      problems.push(issue);
    }

    // Check 3: Frontend connectivity
    console.log("\n🔍 CHECK 3: Frontend Connectivity");
    console.log("─".repeat(60));

    try {
      const res = await request({
        hostname: "localhost",
        port: 3000,
        path: "/",
        method: "GET",
      });
      if (res.status === 200) {
        console.log(`✅ Frontend responding on port 3000`);
      } else {
        const issue = `❌ Frontend returned ${res.status}`;
        console.log(issue);
        problems.push(issue);
      }
    } catch (e) {
      const issue = `❌ Frontend NOT responding - ${e.message}`;
      console.log(issue);
      problems.push(issue);
    }

    // Check 4: Database connection
    console.log("\n🔍 CHECK 4: Database & API");
    console.log("─".repeat(60));

    try {
      const res = await request({
        hostname: "localhost",
        port: 5000,
        path: "/api/health",
        method: "GET",
      });
      if (res.status === 200 && res.body?.status === "ok") {
        console.log(`✅ Health endpoint working`);
      } else {
        const issue = `❌ Health check returned: ${res.status}`;
        console.log(issue);
        problems.push(issue);
      }
    } catch (e) {
      const issue = `❌ API not responding`;
      console.log(issue);
      problems.push(issue);
    }

    // Check 5: Auth endpoints
    console.log("\n🔍 CHECK 5: Authentication Endpoints");
    console.log("─".repeat(60));

    const testEmail = `check_${Date.now()}@test.com`;
    try {
      const res = await request(
        {
          hostname: "localhost",
          port: 5000,
          path: "/api/auth/signup",
          method: "POST",
          headers: { "Content-Type": "application/json" },
        },
        { displayName: "Check", email: testEmail, password: "Test123!" },
      );

      if (res.status === 200) {
        console.log(`✅ Signup endpoint working`);
      } else {
        const issue = `⚠️  Signup returned ${res.status}: ${res.body?.msg}`;
        console.log(issue);
        problems.push(issue);
      }
    } catch (e) {
      const issue = `❌ Signup endpoint error: ${e.message}`;
      console.log(issue);
      problems.push(issue);
    }

    // Check 6: Workspace endpoints
    console.log("\n🔍 CHECK 6: Workspace CRUD");
    console.log("─".repeat(60));

    try {
      // Create through API
      const signupRes = await request(
        {
          hostname: "localhost",
          port: 5000,
          path: "/api/auth/signup",
          method: "POST",
          headers: { "Content-Type": "application/json" },
        },
        {
          displayName: "Checker",
          email: `wscheck_${Date.now()}@test.com`,
          password: "Test123!",
        },
      );

      let cookies = "";
      if (signupRes.status === 200) {
        const ws = await request(
          {
            hostname: "localhost",
            port: 5000,
            path: "/api/workspaces",
            method: "POST",
            headers: { "Content-Type": "application/json" },
          },
          { name: "Check WS", description: "Checking" },
        );

        if (ws.status === 201 || (ws.status === 200 && ws.body?._id)) {
          console.log(`✅ Workspace creation working`);
        } else {
          const issue = `⚠️  Workspace creation: ${ws.status} ${ws.body?.msg}`;
          console.log(issue);
          problems.push(issue);
        }
      }
    } catch (e) {
      const issue = `⚠️  Workspace check: ${e.message}`;
      console.log(issue);
    }

    // Check 7: Environment variables
    console.log("\n🔍 CHECK 7: Environment Configuration");
    console.log("─".repeat(60));

    const envFiles = [
      "d:\\collaborative-workspace\\backend\\.env",
      "d:\\collaborative-workspace\\frontend\\.env",
    ];

    for (const envFile of envFiles) {
      if (fs.existsSync(envFile)) {
        console.log(
          `✅ ${path.dirname(envFile).split("\\").pop()}/.env exists`,
        );
      } else {
        const issue = `❌ Missing: ${envFile}`;
        console.log(issue);
        problems.push(issue);
      }
    }
  } catch (error) {
    console.error(`\n❌ FATAL: ${error.message}`);
  }

  // RESULTS
  console.log(`
╔════════════════════════════════════════════════════════════════╗
║                      RESULTS                                   ║
╚════════════════════════════════════════════════════════════════╝
`);

  if (problems.length === 0) {
    console.log(`
✅ NO INFRASTRUCTURE PROBLEMS FOUND

    Application appears to be fully functional!
    
    If you're still seeing bugs in the UI:
    1. Open http://localhost:3000 in browser
    2. Press F12 to open DevTools
    3. Go to Console tab
    4. Look for RED error messages
    5. Copy the exact error and send to me
    
    Then I can fix the specific bug you're seeing!
`);
  } else {
    console.log(`\n⚠️  ISSUES DETECTED:\n`);
    problems.forEach((p, i) => console.log(`   ${i + 1}. ${p}`));
    console.log(`
NEXT STEPS:
- Fix the issues above
- Restart servers if needed
- Run this check again
`);
  }

  console.log("\n" + "─".repeat(60));
  console.log("For detailed browser testing, run one of:");
  console.log("  node comprehensive-test.js  - Full API test");
  console.log("  node deep-test.js           - User workflow test ");
  console.log("─".repeat(60) + "\n");
}

findAllBugs().catch(console.error);
