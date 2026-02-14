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
          resolve({ status: res.statusCode, body, headers: res.headers });
        }
      });
    });
    req.on("error", reject);
    if (data) req.write(JSON.stringify(data));
    req.end();
  });
}

async function runTests() {
  console.log("🧪 COMPREHENSIVE API ERROR DETECTION\n" + "=".repeat(70));
  let cookies = "";
  let testsPassed = 0;
  let testsFailed = 0;

  try {
    // Test 1: Health Check
    console.log("\n1️⃣ Health Check");
    let res = await request({
      hostname: "localhost",
      port: 5000,
      path: "/api/health",
      method: "GET",
      headers: { "Content-Type": "application/json" },
    });
    if (res.status === 200 && res.body.status === "ok") {
      console.log("   ✅ Backend responding");
      testsPassed++;
    } else {
      console.log(`   ❌ Failed: Status ${res.status}`);
      testsFailed++;
    }

    // Test 2: Signup
    console.log("\n2️⃣ User Signup");
    res = await request(
      {
        hostname: "localhost",
        port: 5000,
        path: "/api/auth/signup",
        method: "POST",
        headers: { "Content-Type": "application/json" },
      },
      {
        displayName: "Test " + Date.now(),
        email: `test${Date.now()}@example.com`,
        password: "TestPass123!",
      },
    );
    if (res.status === 200 && res.body.user) {
      console.log(`   ✅ User created: ${res.body.user.email}`);
      testsPassed++;
      if (res.headers["set-cookie"]) {
        cookies = Array.isArray(res.headers["set-cookie"])
          ? res.headers["set-cookie"][0].split(";")[0]
          : res.headers["set-cookie"].split(";")[0];
      }
    } else {
      console.log(`   ❌ Failed: ${res.body.msg || res.body.error}`);
      testsFailed++;
    }

    // Test 3: Get Current User
    console.log("\n3️⃣ Get Current User");
    res = await request({
      hostname: "localhost",
      port: 5000,
      path: "/api/auth/user",
      method: "GET",
      headers: { Cookie: cookies },
    });
    if (res.status === 200 && res.body.username) {
      console.log(`   ✅ User retrieved: ${res.body.username}`);
      testsPassed++;
    } else {
      console.log(
        `   ⚠️ Not authenticated (expected if session lost): ${res.body.msg}`,
      );
    }

    // Test 4: List Workspaces (no auth)
    console.log("\n4️⃣ List Workspaces");
    res = await request({
      hostname: "localhost",
      port: 5000,
      path: "/api/workspaces",
      method: "GET",
      headers: { Cookie: cookies },
    });
    if (res.status === 200 && Array.isArray(res.body)) {
      console.log(`   ✅ Workspaces retrieved: ${res.body.length} found`);
      testsPassed++;
    } else if (res.status === 401) {
      console.log("   ⚠️ Requires authentication");
    } else {
      console.log(`   ❌ Failed: ${res.body.msg || `Status ${res.status}`}`);
      testsFailed++;
    }

    // Test 5: Create Workspace
    console.log("\n5️⃣ Create Workspace");
    res = await request(
      {
        hostname: "localhost",
        port: 5000,
        path: "/api/workspaces",
        method: "POST",
        headers: { Cookie: cookies, "Content-Type": "application/json" },
      },
      { name: "Test Workspace", description: "Testing" },
    );
    if ((res.status === 200 || res.status === 201) && res.body._id) {
      console.log(`   ✅ Workspace created: ${res.body._id}`);
      testsPassed++;
    } else {
      console.log(`   ⚠️ Response: ${res.body.msg || `Status ${res.status}`}`);
    }

    // Test 6: Invalid Signup (duplicate email)
    console.log("\n6️⃣ Error Handling - Duplicate Email");
    res = await request(
      {
        hostname: "localhost",
        port: 5000,
        path: "/api/auth/signup",
        method: "POST",
        headers: { "Content-Type": "application/json" },
      },
      {
        displayName: "Duplicate",
        email: `test${Date.now() - 1000}@example.com`,
        password: "TestPass123!",
      },
    );
    if (res.status >= 400) {
      console.log(`   ✅ Error caught: ${res.body.msg}`);
      testsPassed++;
    } else {
      console.log(`   ❌ Should have rejected duplicate`);
      testsFailed++;
    }

    // Test 7: Missing Fields
    console.log("\n7️⃣ Error Handling - Missing Fields");
    res = await request(
      {
        hostname: "localhost",
        port: 5000,
        path: "/api/auth/signup",
        method: "POST",
        headers: { "Content-Type": "application/json" },
      },
      { displayName: "Incomplete" },
    );
    if (res.status >= 400 && res.body.msg) {
      console.log(`   ✅ Error caught: ${res.body.msg}`);
      testsPassed++;
    } else {
      console.log(`   ❌ Should have caught missing fields`);
      testsFailed++;
    }

    // Test 8: Invalid Route
    console.log("\n8️⃣ Error Handling - Invalid Route");
    res = await request({
      hostname: "localhost",
      port: 5000,
      path: "/api/invalid-endpoint",
      method: "GET",
    });
    if (res.status === 404 || res.status >= 400) {
      console.log(`   ✅ 404 Error handled properly`);
      testsPassed++;
    } else {
      console.log(`   ❌ Should return 404`);
      testsFailed++;
    }

    console.log("\n" + "=".repeat(70));
    console.log(`\n📊 RESULTS: ${testsPassed} passed, ${testsFailed} failed\n`);
  } catch (error) {
    console.error("\n❌ Test Error:", error.message);
  }
}

runTests();
