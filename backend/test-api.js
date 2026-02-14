const axios = require("axios");

async function testSignup() {
  try {
    const response = await axios.post(
      "http://localhost:5001/api/auth/signup",
      {
        displayName: "Real Test User",
        email: "realtest@example.com",
        password: "TestPassword123!",
      },
      {
        headers: { "Content-Type": "application/json" },
      },
    );

    console.log("✅ SIGNUP SUCCESSFUL");
    console.log("Response:", response.data);
    return response.data;
  } catch (error) {
    if (error.response) {
      console.log("❌ SIGNUP FAILED");
      console.log("Status:", error.response.status);
      console.log("Error:", error.response.data);
    } else {
      console.log("❌ Connection Error:", error.message);
    }
  }
}

async function testLogin() {
  try {
    const response = await axios.post("http://localhost:5001/api/auth/login", {
      email: "realtest@example.com",
      password: "TestPassword123!",
    });

    console.log("\n✅ LOGIN SUCCESSFUL");
    console.log("Response:", response.data);
    return response.data;
  } catch (error) {
    if (error.response) {
      console.log("\n❌ LOGIN FAILED");
      console.log("Status:", error.response.status);
      console.log("Error:", error.response.data);
    } else {
      console.log("\n❌ Connection Error:", error.message);
    }
  }
}

async function testGetUser() {
  try {
    const response = await axios.get("http://localhost:5001/api/auth/user", {
      withCredentials: true,
    });

    console.log("\n✅ GET USER SUCCESSFUL");
    console.log("Response:", response.data);
  } catch (error) {
    console.log(
      "\n⚠️ Get User (expected to fail without session):",
      error.response?.data?.msg || error.message,
    );
  }
}

async function runAllTests() {
  console.log("🧪 STARTING COMPREHENSIVE API TESTS\n");
  console.log("=".repeat(50));

  await testSignup();
  await testLogin();
  await testGetUser();

  console.log("\n" + "=".repeat(50));
  console.log("✅ TEST SUITE COMPLETE");
}

runAllTests().catch(console.error);
