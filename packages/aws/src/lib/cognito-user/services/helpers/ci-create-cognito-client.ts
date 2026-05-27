import { Cognito } from "@ci-aws/lib";

/**
 * Creates and initializes a Cognito wrapper instance.
 *
 * This keeps service helpers small and consistent.
 */
export async function ciCreateCognitoClient(
  cognitoClientConfig?: ConstructorParameters<typeof Cognito>[0],
) {
  const clientConfig = cognitoClientConfig ?? {
    region: process.env.AWS_REGION,
  };

  const cognito = new Cognito(clientConfig);
  await cognito.initialize();

  return cognito;
}
