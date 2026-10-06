import { describe, expect, it } from "vitest";
import { ApiError } from "../../api/apiError";
import { fieldErrorsFrom } from "./fieldErrors";

const FIELDS = ["name", "email", "password"] as const;

describe("fieldErrorsFrom", () => {
  it("maps validation details to form fields, keeping the first message per field", () => {
    const error = new ApiError(400, {
      code: "VALIDATION_ERROR",
      message: "Request validation failed",
      details: [
        { location: "body", path: "email", message: "Invalid email address" },
        { location: "body", path: "password", message: "Password must be at least 8 characters" },
        { location: "body", path: "password", message: "Second password message" },
        { location: "body", path: "unknownField", message: "Ignored" },
      ],
    });

    expect(fieldErrorsFrom(error, FIELDS)).toEqual({
      email: "Invalid email address",
      password: "Password must be at least 8 characters",
    });
  });

  it("returns no field errors for other errors, so the form shows the general message", () => {
    const conflict = new ApiError(409, { code: "CONFLICT", message: "User already exists" });

    expect(fieldErrorsFrom(conflict, FIELDS)).toEqual({});
    expect(fieldErrorsFrom(new TypeError("Failed to fetch"), FIELDS)).toEqual({});
  });
});
