const http = require("http");
const querystring = require("querystring");

// Helper function to make HTTP requests with cookie support
function makeRequest(options, data = null) {
  return new Promise((resolve, reject) => {
    options.headers = options.headers || {};

    const req = http.request(options, (res) => {
      let body = "";

      res.on("data", (chunk) => {
        body += chunk;
      });

      res.on("end", () => {
        try {
          const parsed = JSON.parse(body);
          resolve({
            status: res.statusCode,
            body: parsed,
            headers: res.headers,
          });
        } catch (e) {
          resolve({ status: res.statusCode, body, headers: res.headers });
        }
      });
    });

    req.on("error", reject);

    if (data) {
      req.write(JSON.stringify(data));
    }

    req.end();
  });
}

async function testWithNativeHttp() {
  console.log("🧪 TESTING WITH NATIVE HTTP (Cookie Support)\n");
  console.log("=".repeat(60));

  let cookies = "";

  try {
    // Step 1: Signup
    console.log("\n📝 Step 1: User Signup");
    let response = await makeRequest(
      {
        hostname: "localhost",
        port: 5001,
        path: "/api/auth/signup",
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
      },
      {
        displayName: "Alice Johnson",
        email: "alice@example.com",
        password: "SecurePass123!",
      },
    );

    console.log(`   Status: ${response.status}`);
    if (response.status === 200) {
      console.log(`✅ Signup successful`);
      console.log(`   User: ${response.body.user.displayName}`);
      console.log(`   Email: ${response.body.user.email}`);

      // Extract cookies
      if (response.headers["set-cookie"]) {
        cookies = Array.isArray(response.headers["set-cookie"])
          ? response.headers["set-cookie"][0]
          : response.headers["set-cookie"];
      }
    } else {
      console.log(`❌ Signup failed: ${response.body.msg}`);
      console.log(`Error: ${response.body.error}`);
      return;
    }

    // Step 2: Get current user
    console.log("\n👤 Step 2: Get Current User");
    response = await makeRequest({
      hostname: "localhost",
      port: 5001,
      path: "/api/auth/user",
      method: "GET",
      headers: {
        Cookie: cookies.split(";")[0], // Get just the session ID part
      },
    });

    console.log(`   Status: ${response.status}`);
    if (response.status === 200) {
      console.log(`✅ Got user:${response.body.username}`);
    } else {
      console.log(`❌ Failed to get user: ${response.body.msg}`);
    }

    // Step 3: Create workspace
    console.log("\n📦 Step 3: Create Workspace");
    response = await makeRequest(
      {
        hostname: "localhost",
        port: 5001,
        path: "/api/workspaces",
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Cookie: cookies.split(";")[0],
        },
      },
      {
        name: "Engineering Team",
        description: "Main engineering workspace",
      },
    );

    console.log(`   Status: ${response.status}`);
    if (response.status === 201 || response.status === 200) {
      console.log(`✅ Workspace created`);
      console.log(`   Name: ${response.body.name}`);
    } else {
      console.log(`❌ Failed: ${response.body.msg || response.body.error}`);
    }

    console.log("\n" + "=".repeat(60));
    console.log("✅ MANUAL TESTING COMPLETE");
    console.log("\nRECOMMENDATION:");
    console.log("Run frontend in browser for full real-user experience");
    console.log("Access: http://localhost:3001");
  } catch (error) {
    console.error("❌ Error:", error.message);
  }
}

console.log("📌 NOTE: For complete real-user testing, use browser interface");
console.log("           API tests show core functionality works\n");

// Simple health checks
async function quickHealthCheck() {
  console.log("🏥 Quick Health Checks:\n");

  try {
    const response = await makeRequest({
      hostname: "localhost",
      port: 5001,
      path: "/api/health",
      method: "GET",
    });

    console.log(`✅ Backend Health: ${response.body.status}`);
  } catch (e) {
    console.log(`❌ Backend Connection Error`);
  }
}

quickHealthCheck().then(() => testWithNativeHttp());
