/**
 * generates a random password compliant with AWS Cognito password policies. AWS Cognito requires
 * passwords to meet the following conditions:
 *
 * - Minimum 8 characters (can be higher based on your settings)
 * - At least one uppercase letter
 * - At least one lowercase letter
 * - At least one number
 * - At least one special character (!@#$%^&*()-_=+[]{}|;:'",.<>?/)
 *
 * @param length
 * @returns
 */
export declare const ciGeneratePassword: (length?: number) => string;
//# sourceMappingURL=ci-generate-password.d.ts.map