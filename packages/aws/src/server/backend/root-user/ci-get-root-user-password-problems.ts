import type { CiRootUserPasswordPolicy } from "./types";

/**
 * Returns human-readable requirements that the supplied password does not meet.
 */
export function ciGetRootUserPasswordProblems(
  password: string,
  policy: CiRootUserPasswordPolicy | undefined,
): string[] {
  const problems: string[] = [];
  const minimumLength = policy?.minLength ?? 8;

  if (password.length < minimumLength) {
    problems.push(`at least ${minimumLength} characters`);
  }

  if (policy?.requireLowercase && !/[a-z]/u.test(password)) {
    problems.push("a lowercase letter");
  }

  if (policy?.requireUppercase && !/[A-Z]/u.test(password)) {
    problems.push("an uppercase letter");
  }

  if (policy?.requireNumbers && !/[0-9]/u.test(password)) {
    problems.push("a number");
  }

  if (policy?.requireSymbols && !/[^A-Za-z0-9]/u.test(password)) {
    problems.push("a symbol");
  }

  return problems;
}
