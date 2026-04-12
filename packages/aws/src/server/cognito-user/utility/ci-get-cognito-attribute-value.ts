import type { AttributeType } from '@aws-sdk/client-cognito-identity-provider';

function ciGetCognitoAttributeValue(attributes: AttributeType[], attributeName: string): string | undefined {
  const found = attributes.find((attr) => attr.Name === attributeName);
  return found?.Value;
}

export { ciGetCognitoAttributeValue };
