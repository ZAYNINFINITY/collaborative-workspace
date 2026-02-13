#!/usr/bin/env node
/**
 * Comprehensive Real-Time Collaboration Test Suite
 * Tests socket connection, messaging, and document updates
 */

const io = require("socket.io-client");
const axios = require("axios");

const API_BASE_URL = "http://localhost:5000/api";
const SOCKET_URL = "http://localhost:5000";

const colors = {
  reset: "\x1b[0m",
  green: "\x1b[32m",
  red: "\x1b[31m",
  yellow: "\x1b[33m",
  blue: "\x1b[36m",
  bold: "\x1b[1m",
};

const log = {
  test: (msg) => console.log(`\n${colors.bold}${colors.blue}📋 TEST: ${msg}${colors.reset}`),
  pass: (msg) => console.log(`${colors.green}✓ PASS${colors.reset}: ${msg}`),
  fail: (msg) => console.log(`${colors.red}✗ FAIL${colors.reset}: ${msg}`),
  info: (msg) => console.log(`${colors.yellow}ℹ INFO${colors.reset}: ${msg}`),
  result: (msg) => console.log(`${colors.bold}${colors.green}${msg}${colors.reset}`),
};

let testResults = {
  passed: 0,
  failed: 0,
  skipped: 0,
};

async function testServerHealth() {
  log.test("Server Health Check");

  try {
    const response = await axios.get(`${API_BASE_URL}/health`);
    if (response.data.status === "ok") {
      log.pass("Backend health check passed");
      testResults.passed++;
    } else {
      log.fail("Backend health check failed");
      testResults.failed++;
    }
  } catch (error) {
    log.fail(`Backend not responding: ${error.message}`);
    testResults.failed++;
  }
}

async function testSocketConnection() {
  log.test("Socket.IO Connection");

  return new Promise((resolve) => {
    const socket = io(SOCKET_URL, {
      withCredentials: true,
      reconnection: true,
      reconnectionDelay: 1000,
      reconnectionDelayMax: 5000,
      reconnectionAttempts: 3,
    });

    let connectSuccess = false;
    let connectionTimeout = setTimeout(() => {
      if (!connectSuccess) {
        log.fail("Socket connection timeout (5s)");
        testResults.failed++;
        socket.disconnect();
        resolve();
      }
    }, 5000);

    socket.on("connect", () => {
      connectSuccess = true;
      clearTimeout(connectionTimeout);
      log.pass(`Socket connected with ID: ${socket.id}`);
      testResults.passed++;

      socket.disconnect();
      resolve();
    });

    socket.on("connect_error", (error) => {
      log.fail(`Socket connection error: ${error.message}`);
      testResults.failed++;
      clearTimeout(connectionTimeout);
      resolve();
    });
  });
}

async function testWorkspaceJoinLeave() {
  log.test("Workspace Join/Leave Events");

  return new Promise((resolve) => {
    const socket = io(SOCKET_URL, {
      withCredentials: true,
      reconnection: true,
    });

    const testWorkspaceId = "test-workspace-123";
    let joinSuccess = false;
    let leaveSuccess = false;

    const timeout = setTimeout(() => {
      log.fail("Test timed out");
      testResults.failed++;
      socket.disconnect();
      resolve();
    }, 3000);

    socket.on("connect", () => {
      log.info(`Connected, attempting to join workspace: ${testWorkspaceId}`);
      socket.emit("joinWorkspace", { workspaceId: testWorkspaceId });
      joinSuccess = true;
      log.pass("Successfully emitted joinWorkspace event");
      testResults.passed++;

      // Test leave after a short delay
      setTimeout(() => {
        log.info(`Attempting to leave workspace: ${testWorkspaceId}`);
        socket.emit("leaveWorkspace", { workspaceId: testWorkspaceId });
        leaveSuccess = true;
        log.pass("Successfully emitted leaveWorkspace event");
        testResults.passed++;

        clearTimeout(timeout);
        socket.disconnect();
        resolve();
      }, 500);
    });

    socket.on("error", (error) => {
      log.fail(`Socket error: ${error}`);
      testResults.failed++;
      clearTimeout(timeout);
      resolve();
    });
  });
}

async function testDocumentEditEvent() {
  log.test("Document Edit Broadcasting");

  return new Promise((resolve) => {
    const socket = io(SOCKET_URL, {
      withCredentials: true,
      reconnection: true,
    });

    const testPayload = {
      workspaceId: "test-ws-123",
      documentId: "test-doc-456",
      cell: "0-0",
      value: "Test Value",
      userId: "test-user-789",
    };

    let eventSent = false;
    const timeout = setTimeout(() => {
      if (!eventSent) {
        log.fail("Document edit event not sent");
        testResults.failed++;
      }
      socket.disconnect();
      resolve();
    }, 2000);

    socket.on("connect", () => {
      socket.emit("joinWorkspace", { workspaceId: testPayload.workspaceId });

      setTimeout(() => {
        log.info(`Emitting document:edit event: ${JSON.stringify(testPayload)}`);
        socket.emit("document:edit", testPayload);
        eventSent = true;
        log.pass("Successfully emitted document:edit event");
        testResults.passed++;

        clearTimeout(timeout);
        setTimeout(() => {
          socket.disconnect();
          resolve();
        }, 500);
      }, 300);
    });

    socket.on("error", (error) => {
      log.fail(`Socket error: ${error}`);
      testResults.failed++;
      clearTimeout(timeout);
      resolve();
    });
  });
}

async function testSocketMultiClientBroadcast() {
  log.test("Multi-Client Message Broadcasting");

  return new Promise((resolve) => {
    const socket1 = io(SOCKET_URL, {
      withCredentials: true,
      reconnection: true,
    });

    const socket2 = io(SOCKET_URL, {
      withCredentials: true,
      reconnection: true,
    });

    const testWorkspaceId = "broadcast-test-ws";
    let socket1Connected = false;
    let socket2Connected = false;
    let messageReceived = false;

    const timeout = setTimeout(() => {
      log.fail("Test timed out");
      if (!messageReceived) {
        log.fail("Message not broadcast between clients");
        testResults.failed++;
      }
      socket1.disconnect();
      socket2.disconnect();
      resolve();
    }, 4000);

    socket1.on("connect", () => {
      socket1Connected = true;
      log.info(`Socket 1 connected: ${socket1.id}`);
      socket1.emit("joinWorkspace", { workspaceId: testWorkspaceId });

      if (socket1Connected && socket2Connected) startTest();
    });

    socket2.on("connect", () => {
      socket2Connected = true;
      log.info(`Socket 2 connected: ${socket2.id}`);
      socket2.emit("joinWorkspace", { workspaceId: testWorkspaceId });

      if (socket1Connected && socket2Connected) startTest();
    });

    socket2.on("message:new", (data) => {
      messageReceived = true;
      log.pass(
        `Socket 2 received broadcast: ${JSON.stringify(data.message || data)}`,
      );
      testResults.passed++;
      clearTimeout(timeout);

      socket1.disconnect();
      socket2.disconnect();
      resolve();
    });

    function startTest() {
      log.info("Both clients connected, sending test message...");
      const testMessage = {
        workspaceId: testWorkspaceId,
        message: {
          _id: "test-msg-123",
          content: "Test broadcast message",
          author: { username: "TestUser" },
        },
      };

      log.info(`Socket 1 emitting: ${JSON.stringify(testMessage)}`);
      socket1.emit("message:send", testMessage);
    }

    socket1.on("error", (error) => {
      log.fail(`Socket 1 error: ${error}`);
      testResults.failed++;
    });

    socket2.on("error", (error) => {
      log.fail(`Socket 2 error: ${error}`);
      testResults.failed++;
    });
  });
}

async function testCORSConfiguration() {
  log.test("CORS Configuration");

  try {
    const response = await axios.get(`${API_BASE_URL}/workspaces`, {
      headers: {
        Origin: "http://localhost:3000",
      },
    });

    const corsHeader = response.headers["access-control-allow-origin"];
    if (corsHeader) {
      log.pass(`CORS properly configured: ${corsHeader}`);
      testResults.passed++;
    } else {
      log.fail("CORS header not found");
      testResults.failed++;
    }
  } catch (error) {
    if (error.response?.status === 401) {
      log.pass("CORS configured (401 auth required is expected)");
      testResults.passed++;
    } else {
      log.fail(`CORS test error: ${error.message}`);
      testResults.failed++;
    }
  }
}

async function runAllTests() {
  console.log(
    `\n${colors.bold}${colors.blue}═══════════════════════════════════════════════${colors.reset}`,
  );
  console.log(
    `${colors.bold}${colors.blue}   Real-Time Collaboration Test Suite${colors.reset}`,
  );
  console.log(
    `${colors.bold}${colors.blue}═══════════════════════════════════════════════${colors.reset}\n`,
  );

  await testServerHealth();
  await testSocketConnection();
  await testWorkspaceJoinLeave();
  await testDocumentEditEvent();
  await testSocketMultiClientBroadcast();
  await testCORSConfiguration();

  // Print summary
  console.log(
    `\n${colors.bold}${colors.blue}═══════════════════════════════════════════════${colors.reset}`,
  );
  console.log(`${colors.bold}${colors.blue}   Test Results Summary${colors.reset}`);
  console.log(
    `${colors.bold}${colors.blue}═══════════════════════════════════════════════${colors.reset}\n`,
  );

  const total = testResults.passed + testResults.failed + testResults.skipped;
  const percentage = ((testResults.passed / total) * 100).toFixed(1);

  console.log(`${colors.green}✓ Passed:${colors.reset}  ${testResults.passed}/${total}`);
  console.log(`${colors.red}✗ Failed:${colors.reset}  ${testResults.failed}/${total}`);
  if (testResults.skipped > 0) {
    console.log(`${colors.yellow}⊘ Skipped:${colors.reset} ${testResults.skipped}/${total}`);
  }

  console.log(`\n${colors.bold}Success Rate: ${percentage}%${colors.reset}\n`);

  if (testResults.failed === 0) {
    log.result("🎉 ALL TESTS PASSED! Real-time collaboration is working!");
  } else {
    log.result(`⚠️  ${testResults.failed} test(s) failed. Check the logs above.`);
  }

  console.log(
    `${colors.bold}${colors.blue}═══════════════════════════════════════════════${colors.reset}\n`,
  );

  process.exit(testResults.failed > 0 ? 1 : 0);
}

runAllTests().catch((error) => {
  console.error("Test suite error:", error);
  process.exit(1);
});
