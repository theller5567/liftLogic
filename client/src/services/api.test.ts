import { describe, expect, it } from "vitest";

import { ApiError, isAuthSessionExpiredError } from "./api";

describe("auth API error classification", () => {
  it("treats invalid Firebase tokens as expired auth sessions", () => {
    const error = new ApiError("Invalid Firebase ID token.", 401, "INVALID_FIREBASE_TOKEN");

    expect(isAuthSessionExpiredError(error)).toBe(true);
  });

  it("treats token refresh failures as expired auth sessions", () => {
    const error = new ApiError("Could not refresh token.", 401, "TOKEN_REFRESH_FAILED");

    expect(isAuthSessionExpiredError(error)).toBe(true);
  });

  it("does not treat non-auth API errors as expired sessions", () => {
    const error = new ApiError("Workout not found.", 404, "WORKOUT_SESSION_NOT_FOUND");

    expect(isAuthSessionExpiredError(error)).toBe(false);
  });
});
