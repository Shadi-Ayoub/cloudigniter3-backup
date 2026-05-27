import { signOut } from "aws-amplify/auth";

/**
 * Sign out the current authenticated user through Amplify Auth.
 */
export async function ciAwsSignOut() {
  await signOut();
}
