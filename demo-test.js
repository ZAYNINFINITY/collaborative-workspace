/**
 * COMPREHENSIVE DEMO TEST SUITE
 * Tests all app features as if real users are interacting
 * February 13, 2026
 */

const axios = require("axios");

const API_BASE = "http://localhost:5000";
const api = axios.create({
  baseURL: API_BASE,
  withCredentials: true,
  jar: true,
  validateStatus: () => true, // Don't throw on any status
});

let testResults = {
  passed: 0,
  failed: 0,
  tests: [],
};

// ===== TEST HELPERS =====

function log(section, message, type = "INFO") {
  const icon = type === "PASS" ? "✅" : type === "FAIL" ? "❌" : "ℹ️";
  console.log(`${icon} ${section}: ${message}`);
}

function testPassed(name) {
  testResults.passed++;
  testResults.tests.push({ name, status: "PASS" });
  log("TEST PASS", name, "PASS");
}

function testFailed(name, reason) {
  testResults.failed++;
  testResults.tests.push({ name, status: "FAIL", reason });
  log("TEST FAIL", `${name} - ${reason}`, "FAIL");
}

// ===== DEMO TEST 1: WORKSPACE CREATION =====

async function testWorkspaceCreation() {
  console.log("\n" + "=".repeat(60));
  console.log("🧪 DEMO TEST 1: WORKSPACE CREATION");
  console.log("=".repeat(60));

  try {
    const response = await api.post("/api/workspaces", {
      name: "Demo Project - February 13",
      description: "Test workspace for team collaboration demo",
      repos: [],
    });

    if (response.status === 201) {
      testPassed("Create Workspace", "new workspace created successfully");
      return response.data._id;
    } else {
      testFailed("Create Workspace", `Status ${response.status}`);
      return null;
    }
  } catch (err) {
    testFailed("Create Workspace", err.message);
    return null;
  }
}

// ===== DEMO TEST 2: LIST MEMBERS =====

async function testListMembers(workspaceId) {
  console.log("\n" + "=".repeat(60));
  console.log("🧪 DEMO TEST 2: LIST WORKSPACE MEMBERS");
  console.log("=".repeat(60));

  try {
    const response = await api.get(`/api/workspaces/${workspaceId}/members`);

    if (response.status === 200 && Array.isArray(response.data)) {
      const memberCount = response.data.length;
      testPassed(
        "List Members",
        `retrieved ${memberCount} member${memberCount !== 1 ? "s" : ""}`,
      );

      // Display member details
      response.data.forEach((member) => {
        log(
          "MEMBER",
          `${member.displayName} (${member.email}) - Role: ${member.role}`,
        );
      });

      return response.data;
    } else {
      testFailed("List Members", `Status ${response.status}`);
      return [];
    }
  } catch (err) {
    testFailed("List Members", err.message);
    return [];
  }
}

// ===== DEMO TEST 3: INVITE TEAM MEMBER =====

async function testInviteMember(workspaceId) {
  console.log("\n" + "=".repeat(60));
  console.log("🧪 DEMO TEST 3: INVITE NEW TEAM MEMBER");
  console.log("=".repeat(60));

  try {
    const testEmail = `collaborator-${Date.now()}@example.com`;
    log("INVITE", `Sending invitation to: ${testEmail}`);

    const response = await api.post(`/api/workspaces/${workspaceId}/invite`, {
      email: testEmail,
      role: "member",
    });

    if (response.status === 200) {
      testPassed(
        "Invite Member",
        `invitation sent to ${testEmail}`,
      );
      return { email: testEmail, ...response.data };
    } else {
      testFailed(
        "Invite Member",
        `Status ${response.status} - ${JSON.stringify(response.data)}`,
      );
      return null;
    }
  } catch (err) {
    testFailed("Invite Member", err.message);
    return null;
  }
}

// ===== DEMO TEST 4: GET PENDING INVITATIONS =====

async function testGetPendingInvites(workspaceId) {
  console.log("\n" + "=".repeat(60));
  console.log("🧪 DEMO TEST 4: VIEW PENDING INVITATIONS");
  console.log("=".repeat(60));

  try {
    const response = await api.get(`/api/workspaces/${workspaceId}/invites`);

    if (response.status === 200 && Array.isArray(response.data)) {
      const count = response.data.length;
      testPassed(
        "Get Pending Invites",
        `retrieved ${count} pending invitation${count !== 1 ? "s" : ""}`,
      );

      response.data.forEach((invite) => {
        log(
          "PENDING",
          `${invite.email} - Role: ${invite.role} (Created: ${new Date(invite.createdAt).toLocaleString()})`,
        );
      });

      return response.data;
    } else {
      testFailed("Get Pending Invites", `Status ${response.status}`);
      return [];
    }
  } catch (err) {
    testFailed("Get Pending Invites", err.message);
    return [];
  }
}

// ===== DEMO TEST 5: UPDATE MEMBER ROLE =====

async function testUpdateMemberRole(workspaceId, members) {
  console.log("\n" + "=".repeat(60));
  console.log("🧪 DEMO TEST 5: CHANGE MEMBER ROLE");
  console.log("=".repeat(60));

  if (!members || members.length < 2) {
    log(
      "SKIP",
      "Need at least 2 members to test role change (only owner in workspace)",
    );
    return;
  }

  try {
    // Find a non-owner member
    const memberToUpdate = members.find((m) => !m.isOwner);
    if (!memberToUpdate) {
      log("SKIP", "No non-owner members to test with");
      return;
    }

    const newRole = memberToUpdate.role === "member" ? "admin" : "member";
    log(
      "ROLE CHANGE",
      `Changing ${memberToUpdate.displayName} from ${memberToUpdate.role} to ${newRole}`,
    );

    const response = await api.put(
      `/api/workspaces/${workspaceId}/members/${memberToUpdate.userId}`,
      { role: newRole },
    );

    if (response.status === 200) {
      testPassed(
        "Change Member Role",
        `${memberToUpdate.displayName}'s role changed to ${newRole}`,
      );
    } else {
      testFailed("Change Member Role", `Status ${response.status}`);
    }
  } catch (err) {
    testFailed("Change Member Role", err.message);
  }
}

// ===== DEMO TEST 6: WORKSPACE CONTENT =====

async function testWorkspaceContent(workspaceId) {
  console.log("\n" + "=".repeat(60));
  console.log("🧪 DEMO TEST 6: WORKSPACE CONTENT (TASKS, NOTES, MESSAGES)");
  console.log("=".repeat(60));

  try {
    const response = await api.get(`/api/workspaces/${workspaceId}`);

    if (response.status === 200) {
      const { notes, tasks, messages, documents } = response.data;

      log(
        "CONTENT",
        `Notes: ${notes?.length || 0}, Tasks: ${tasks?.length || 0}, Messages: ${messages?.length || 0}, Documents: ${documents?.length || 0}`,
      );

      testPassed("Load Workspace Content", "all content loaded successfully");

      if (tasks && tasks.length > 0) {
        log("TASKS", `Found ${tasks.length} task(s)`);
        tasks.slice(0, 2).forEach((task) => {
          log("TASK", `${task.title} (${task.status})`);
        });
      }

      if (messages && messages.length > 0) {
        log("MESSAGES", `Found ${messages.length} message(s)`);
        messages
          .slice(-2)
          .forEach((msg) => {
            log("MSG", `${msg.author?.displayName}: "${msg.content.substring(0, 50)}..."`);
          });
      }

      return response.data;
    } else {
      testFailed("Load Workspace Content", `Status ${response.status}`);
      return null;
    }
  } catch (err) {
    testFailed("Load Workspace Content", err.message);
    return null;
  }
}

// ===== DEMO TEST 7: CREATE NOTE =====

async function testCreateNote(workspaceId) {
  console.log("\n" + "=".repeat(60));
  console.log("🧪 DEMO TEST 7: CREATE NOTE IN WORKSPACE");
  console.log("=".repeat(60));

  try {
    const noteContent = `Demo note created at ${new Date().toLocaleString()} - Testing team collaboration`;

    const response = await api.post(`/api/workspaces/${workspaceId}/notes`, {
      content: noteContent,
    });

    if (response.status === 201) {
      testPassed("Create Note", `note created: "${noteContent.substring(0, 40)}..."`);
    } else {
      testFailed("Create Note", `Status ${response.status}`);
    }
  } catch (err) {
    testFailed("Create Note", err.message);
  }
}

// ===== DEMO TEST 8: CREATE TASK =====

async function testCreateTask(workspaceId) {
  console.log("\n" + "=".repeat(60));
  console.log("🧪 DEMO TEST 8: CREATE TASK IN WORKSPACE");
  console.log("=".repeat(60));

  try {
    const taskData = {
      title: "Demo Task - Team Collaboration Testing",
      description: "Test task created for demo purposes",
      status: "todo",
      priority: "high",
    };

    const response = await api.post(`/api/workspaces/${workspaceId}/tasks`, taskData);

    if (response.status === 201) {
      testPassed("Create Task", `task created: "${taskData.title}"`);
    } else {
      testFailed("Create Task", `Status ${response.status}`);
    }
  } catch (err) {
    testFailed("Create Task", err.message);
  }
}

// ===== DEMO TEST 9: SEND MESSAGE =====

async function testSendMessage(workspaceId) {
  console.log("\n" + "=".repeat(60));
  console.log("🧪 DEMO TEST 9: SEND MESSAGE IN WORKSPACE");
  console.log("=".repeat(60));

  try {
    const messageContent = `Demo message: Team collaboration system testing at ${new Date().toLocaleString()}`;

    const response = await api.post(`/api/workspaces/${workspaceId}/messages`, {
      content: messageContent,
    });

    if (response.status === 201) {
      testPassed("Send Message", `message sent: "${messageContent.substring(0, 40)}..."`);
    } else {
      testFailed("Send Message", `Status ${response.status}`);
    }
  } catch (err) {
    testFailed("Send Message", err.message);
  }
}

// ===== DEMO TEST 10: GET CURRENT USER =====

async function testGetCurrentUser() {
  console.log("\n" + "=".repeat(60));
  console.log("🧪 DEMO TEST 10: GET CURRENT USER INFO");
  console.log("=".repeat(60));

  try {
    const response = await api.get("/api/auth/user");

    if (response.status === 200 && response.data.user) {
      const user = response.data.user;
      testPassed("Get Current User", `logged in as ${user.displayName}`);
      log("USER", `Username: ${user.username}`);
      log("USER", `Email: ${user.email}`);
      log("USER", `Provider: ${user.githubId ? "GitHub" : user.googleId ? "Google" : "Unknown"}`);
      return user;
    } else if (response.status === 401) {
      log("INFO", "User not authenticated - API available in public mode");
      return null;
    } else {
      testFailed("Get Current User", `Status ${response.status}`);
      return null;
    }
  } catch (err) {
    testFailed("Get Current User", err.message);
    return null;
  }
}

// ===== RUN ALL TESTS =====

async function runAllTests() {
  console.log("\n\n");
  console.log(
    "╔════════════════════════════════════════════════════════════╗",
  );
  console.log(
    "║     🚀 COMPREHENSIVE APP DEMO TEST SUITE                  ║",
  );
  console.log(
    "║     Real-World Scenario Testing                           ║",
  );
  console.log(
    "║     February 13, 2026                                     ║",
  );
  console.log(
    "╚════════════════════════════════════════════════════════════╝",
  );

  // Test 1: Get current user
  const user = await testGetCurrentUser();

  // Test 2: Create workspace
  const workspaceId = await testWorkspaceCreation();
  if (!workspaceId) {
    console.error("❌ Cannot continue - workspace creation failed");
    return;
  }

  // Test 3: List members
  const members = await testListMembers(workspaceId);

  // Test 4: Invite team member
  await testInviteMember(workspaceId);

  // Test 5: Get pending invites
  await testGetPendingInvites(workspaceId);

  // Test 6: Update member role (if multiple members)
  await testUpdateMemberRole(workspaceId, members);

  // Test 7: Load workspace content
  await testWorkspaceContent(workspaceId);

  // Test 8: Create note
  await testCreateNote(workspaceId);

  // Test 9: Create task
  await testCreateTask(workspaceId);

  // Test 10: Send message
  await testSendMessage(workspaceId);

  // ===== SUMMARY =====

  console.log("\n\n");
  console.log(
    "╔════════════════════════════════════════════════════════════╗",
  );
  console.log(
    "║     📊 TEST RESULTS SUMMARY                               ║",
  );
  console.log(
    "╚════════════════════════════════════════════════════════════╝",
  );

  console.log("");
  console.log(
    `✅ Passed: ${testResults.passed}`,
  );
  console.log(
    `❌ Failed: ${testResults.failed}`,
  );
  console.log(
    `📈 Success Rate: ${Math.round((testResults.passed / (testResults.passed + testResults.failed)) * 100)}%`,
  );

  console.log("\n📋 Test Results:");
  testResults.tests.forEach((test) => {
    const icon = test.status === "PASS" ? "✅" : "❌";
    const reason = test.reason ? ` (${test.reason})` : "";
    console.log(`  ${icon} ${test.name}${reason}`);
  });

  console.log("\n");
  console.log(
    "╔════════════════════════════════════════════════════════════╗",
  );
  if (testResults.failed === 0) {
    console.log(
      "║     🎉 ALL TESTS PASSED - APP IS WORKING! 🎉             ║",
    );
  } else {
    console.log(
      `║     ⚠️  ${testResults.failed} TEST(S) FAILED - CHECK ABOVE  ║`,
    );
  }
  console.log(
    "╚════════════════════════════════════════════════════════════╝",
  );

  console.log("\n");
}

// Run tests
runAllTests().catch((err) => {
  console.error("Fatal error:", err);
  process.exit(1);
});
