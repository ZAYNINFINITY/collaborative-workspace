// Jest setup file - runs before all tests
const mongoose = require("mongoose");

// Silence console logs during tests except errors
const originalLog = console.log;
const originalWarn = console.warn;

beforeAll(async () => {
  // Set longer timeout for MongoDB connection
  jest.setTimeout(10000);

  // Connect to MongoDB test database
  const mongoUri =
    process.env.MONGO_URI ||
    process.env.MONGODB_URI ||
    "mongodb://localhost:27017/collaborative-workspace-test";

  try {
    await mongoose.connect(mongoUri);
  } catch (error) {
    console.error("MongoDB connection failed:", error.message);
    throw error;
  }
});

afterAll(async () => {
  // Clean up database after all tests
  try {
    await mongoose.connection.close();
  } catch (error) {
    console.error("MongoDB disconnect failed:", error.message);
  }
});

// Clear logs during tests for cleaner output
global.console.log = jest.fn((...args) => {
  // Allow test output only
  if (args[0]?.includes?.("PASS") || args[0]?.includes?.("FAIL")) {
    originalLog(...args);
  }
});

global.console.warn = jest.fn();
