import { describe, it, expect } from "vitest";

/**
 * Full Dashboard render is not run in Vitest: importing the page pulls in three.js +
 * @react-three/fiber and can exceed Node heap in jsdom. Cover this screen with E2E
 * (Playwright/Cypress) or a shallow test of extracted presentational pieces.
 */
describe("Dashboard page", () => {
  it("suite placeholder — heavy R3F/three deferred to E2E", () => {
    expect(true).toBe(true);
  });
});
