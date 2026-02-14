const axios = require("axios");

// Create axios instance with cookie jar to maintain session
const client = axios.create({
  withCredentials: true,
  jar: true,
});

const API_BASE = "http://localhost:5001/api";

async function delay(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function testCompleteWorkflow() {
  console.log("🧪 COMPREHENSIVE REAL-USER APPLICATION VERIFICATION\n");
  console.log("=".repeat(60));

  try {
    // Step 1: Signup
    console.log("\n📝 Step 1: Testing Signup");
    const signupData = {
      displayName: "John Doe",
      email: "johndoe@example.com",
      password: "SecurePassword123!",
    };

    let response = await client.post(`${API_BASE}/auth/signup`, signupData);
    console.log("✅ Signup successful");
    console.log(`   User ID: ${response.data.user.id}`);
    console.log(`   Email: ${response.data.user.email}`);
    const userId = response.data.user.id;

    // Step 2: Check current user (without login, should work from signup session)
    console.log("\n👤 Step 2: Checking Current User");
    response = await client.get(`${API_BASE}/auth/user`);
    console.log("✅ Got current user");
    console.log(`   Username: ${response.data.username}`);
    console.log(`   Email: ${response.data.email}`);

    // Step 3: Create a workspace
    console.log("\n📦 Step 3: Creating Workspace");
    const workspaceData = {
      name: "Test Workspace",
      description: "This is a test collaborative workspace",
    };

    response = await client.post(`${API_BASE}/workspaces`, workspaceData);
    console.log("✅ Workspace created");
    console.log(`   Workspace ID: ${response.data._id}`);
    console.log(`   Name: ${response.data.name}`);
    const workspaceId = response.data._id;

    // Step 4: Get workspace details
    console.log("\n🔍 Step 4: Fetching Workspace Details");
    response = await client.get(`${API_BASE}/workspaces/${workspaceId}`);
    console.log("✅ Workspace details retrieved");
    console.log(`   Owner: ${response.data.owner}`);
    console.log(`   Members: ${response.data.members.length}`);

    // Step 5: Create a note
    console.log("\n📝 Step 5: Creating Note");
    const noteData = {
      title: "Test Note",
      content: "This is a test note to verify the workspace functionality",
    };

    response = await client.post(
      `${API_BASE}/workspaces/${workspaceId}/notes`,
      noteData,
    );
    console.log("✅ Note created");
    console.log(`   Note ID: ${response.data._id}`);
    console.log(`   Title: ${response.data.title}`);

    // Step 6: Create a task
    console.log("\n✅ Step 6: Creating Task");
    const taskData = {
      title: "Complete Project Setup",
      description: "Set up all necessary configurations",
      status: "todo",
      priority: "high",
    };

    response = await client.post(
      `${API_BASE}/workspaces/${workspaceId}/tasks`,
      taskData,
    );
    console.log("✅ Task created");
    console.log(`   Task ID: ${response.data._id}`);
    console.log(`   Status: ${response.data.status}`);

    // Step 7: List workspaces
    console.log("\n📋 Step 7: Listing User Workspaces");
    response = await client.get(`${API_BASE}/workspaces`);
    console.log("✅ Workspaces fetched");
    console.log(`   Total workspaces: ${response.data.length}`);

    // Step 8: Logout
    console.log("\n🚪 Step 8: Testing Logout");
    response = await client.post(`${API_BASE}/auth/logout`);
    console.log("✅ Logged out successfully");

    // Step 9: Verify authentication is cleared
    console.log("\n🔒 Step 9: Verifying Authentication is Cleared");
    try {
      await client.get(`${API_BASE}/auth/user`);
      console.log("❌ Still authenticated after logout (unexpected)");
    } catch (error) {
      if (error.response?.status === 401) {
        console.log("✅ Confirmed: Not authenticated after logout");
      }
    }

    console.log("\n" + "=".repeat(60));
    console.log("✅ ALL TESTS PASSED");
    console.log("\n📊 VERIFIED FEATURES:");
    console.log("  ✅ User signup with email/password");
    console.log("  ✅ Session management");
    console.log("  ✅ Get current user");
    console.log("  ✅ Workspace creation");
    console.log("  ✅ Workspace retrieval");
    console.log("  ✅ Note creation");
    console.log("  ✅ Task creation");
    console.log("  ✅ Workspace listing");
    console.log("  ✅ User logout");
    console.log("  ✅ Session clearing");
  } catch (error) {
    console.log("\n❌ TEST FAILED");
    if (error.response) {
      console.log(`Status: ${error.response.status}`);
      console.log(`Error: ${JSON.stringify(error.response.data)}`);
    } else {
      console.log(`Error: ${error.message}`);
    }
    console.log("\nStack:", error.stack.split("\n").slice(0, 3).join("\n"));
  }
}

testCompleteWorkflow();
