import { ApiError } from "../../api/apiError";

export const fieldErrorsFrom = <Field extends string>(
  error: unknown,
  fields: readonly Field[],
): Partial<Record<Field, string>> => {
  if (!(error instanceof ApiError) || error.code !== "VALIDATION_ERROR" || !error.details) {
    return {};
  }

  const result: Partial<Record<Field, string>> = {};
  for (const detail of error.details) {
    const field = fields.find((name) => name === detail.path);
    if (field && !result[field]) result[field] = detail.message;
  }
  return result;
};
