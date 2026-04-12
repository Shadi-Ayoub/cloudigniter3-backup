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
export const ciGeneratePassword = (length: number = 12): string => {
  const upperCaseChars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
  const lowerCaseChars = 'abcdefghijklmnopqrstuvwxyz';
  const numberChars = '0123456789';
  const specialChars = '!@#$%^&*()-_=+[]{}|;:\'",.<>?/';
  const allChars = upperCaseChars + lowerCaseChars + numberChars + specialChars;

  if (length < 8) {
    throw new Error('Password length must be at least 8 characters.');
  }

  const getRandomChar = (charSet: string) => charSet[Math.floor(Math.random() * charSet.length)];

  let password = [
    getRandomChar(upperCaseChars), // Ensure at least one uppercase
    getRandomChar(lowerCaseChars), // Ensure at least one lowercase
    getRandomChar(numberChars), // Ensure at least one number
    getRandomChar(specialChars), // Ensure at least one special character
  ];

  // Fill the rest of the password with random characters
  for (let i = 4; i < length; i++) {
    password.push(getRandomChar(allChars));
  }

  // Shuffle the password to avoid predictable patterns
  password = password.sort(() => Math.random() - 0.5);

  return password.join('');
};
