import { afterEach, describe, expect, it, vi } from "vitest";

import {
  API_REQUEST_TIMEOUT_MS,
  ApiError,
  createConnectionApiError,
  createTimedRequestSignal,
  isAuthSessionExpiredError,
} from "./api";

describe("auth API error classification", () => {
  afterEach(() => {
    vi.useRealTimers();
  });

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

  it("normalizes timeout failures into recoverable connection errors", () => {
    const error = createConnectionApiError("timeout");

    expect(error.status).toBe(408);
    expect(error.code).toBe("REQUEST_TIMEOUT");
    expect(error.message).toContain("longer than expected");
    expect(isAuthSessionExpiredError(error)).toBe(false);
  });

  it("normalizes network failures without marking auth expired", () => {
    const error = createConnectionApiError("network");

    expect(error.status).toBe(0);
    expect(error.code).toBe("NETWORK_ERROR");
    expect(isAuthSessionExpiredError(error)).toBe(false);
  });

  it("keeps request timeout active when a custom signal is provided", () => {
    vi.useFakeTimers();
    const externalController = new AbortController();
    const requestSignal = createTimedRequestSignal(externalController.signal);

    vi.advanceTimersByTime(API_REQUEST_TIMEOUT_MS);

    expect(requestSignal.signal.aborted).toBe(true);
    expect(requestSignal.didTimeout()).toBe(true);
    requestSignal.cleanup();
  });

  it("does not classify caller aborts as request timeouts", () => {
    vi.useFakeTimers();
    const externalController = new AbortController();
    const requestSignal = createTimedRequestSignal(externalController.signal);

    externalController.abort();

    expect(requestSignal.signal.aborted).toBe(true);
    expect(requestSignal.didTimeout()).toBe(false);
    requestSignal.cleanup();
  });
});
