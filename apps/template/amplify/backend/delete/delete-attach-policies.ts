// amplify/infrastructure/attach-policies.ts
import { Stack } from 'aws-cdk-lib';
import { Policy, PolicyStatement, Effect } from 'aws-cdk-lib/aws-iam';
// import { createCommonLambdaPolicy } from '@cloudigniter/next/amplify';
// import { createUserHandler } from './functions/user/create-user/resource';
// import {
//   attachCorePolicies,
//   type CoreFunctionsList,
//   type CoreTablesList,
// } from '@cloudigniter/next/server';

import type { Backend } from './types';

export function attachPolicies(backend: Backend) {
  // Store references to the functions in an object
  const functions = {
    createCognitoUserHandler: backend.createCognitoUserHandler.resources.lambda,
    getCognitoUserHandler: backend.getCognitoUserHandler.resources.lambda,
    getSettingsHandler: backend.getSettingsHandler.resources.lambda,
    setSettingsHandler: backend.setSettingsHandler.resources.lambda,
  };

  // const createCognitoUserHandler =
  //   backend.createCognitoUserHandler.resources.lambda;
  // const getCognitoUserHandler = backend.getCognitoUserHandler.resources.lambda;
  // const getSettingsHandler = backend.getSettingsHandler.resources.lambda;
  // const setSettingsHandler = backend.setSettingsHandler.resources.lambda;

  // Store references to the tables in an object
  const tables = {
    systemTable: backend.data.resources.tables.System,
    userProfileTable: backend.data.resources.tables.UserProfile,
  };

  // attachCorePolicies(functions, tables);

  // const systemTable = backend.data.resources.tables.System;
  // const userProfileTable = backend.data.resources.tables.UserProfile;

  // Define the common policy statement once
  // const commonPolicyStatement = new PolicyStatement({
  //   effect: Effect.ALLOW,
  //   actions: [
  //     'cloudwatch:GetMetricStatistics',
  //     'logs:DescribeLogStreams',
  //     'logs:GetLogEvents',
  //     'logs:CreateLogGroup',
  //     'logs:CreateLogStream',
  //     'logs:PutLogEvents',
  //     'xray:PutTraceSegments',
  //     'xray:PutTelemetryRecords',
  //   ],
  //   resources: ['*'],
  // });

  // const policyCreateUser = new Policy(
  //   Stack.of(tables.userProfileTable),
  //   'createUserPolicy',
  //   {
  //     statements: [
  //       new PolicyStatement({
  //         effect: Effect.ALLOW,
  //         actions: ['dynamodb:PutItem'],
  //         resources: [tables.userProfileTable.tableArn],
  //       }),
  //     ],
  //   }
  // );

  // const policyGetSetSettings = new Policy(
  //   Stack.of(tables.systemTable),
  //   'GetSetSettingsPolicy',
  //   {
  //     statements: [
  //       new PolicyStatement({
  //         effect: Effect.ALLOW,
  //         actions: ['dynamodb:GetItem', 'dynamodb:PutItem'],
  //         resources: [tables.systemTable.tableArn],
  //       }),
  //     ],
  //   }
  // );

  // functions.createCognitoUserHandler.role?.attachInlinePolicy(policyCreateUser);

  functions.createCognitoUserHandler.addToRolePolicy(
    new PolicyStatement({
      effect: Effect.ALLOW,
      actions: ['dynamodb:PutItem'],
      resources: [tables.systemTable.tableArn],
    })
  );

  // functions.setSettingsHandler.role?.attachInlinePolicy(policyGetSetSettings);

  functions.setSettingsHandler.addToRolePolicy(
    new PolicyStatement({
      effect: Effect.ALLOW,
      actions: ['dynamodb:GetItem', 'dynamodb:PutItem'],
      resources: [tables.systemTable.tableArn],
    })
  );

  // functions.getSettingsHandler.role?.attachInlinePolicy(policyGetSetSettings);

  functions.getSettingsHandler.addToRolePolicy(
    new PolicyStatement({
      effect: Effect.ALLOW,
      actions: ['dynamodb:GetItem', 'dynamodb:PutItem'],
      resources: [tables.systemTable.tableArn],
    })
  );

  // Loop through the functions in the object and attach the common policy statement
  // Object.values(functions).forEach((fn) => {
  //   fn.role?.addToPrincipalPolicy(commonPolicyStatement);
  // });

  Object.values(functions).forEach((fn) => {
    const stack = Stack.of(fn);
    const logGroupArn = `arn:aws:logs:${stack.region}:${stack.account}:log-group:/aws/lambda/${fn.functionName}:*`;

    fn.addToRolePolicy(
      new PolicyStatement({
        effect: Effect.ALLOW,
        actions: [
          'logs:CreateLogGroup', // (this one often still needs '*')
          'logs:CreateLogStream',
          'logs:PutLogEvents',
        ],
        resources: [logGroupArn],
      })
    );

    // If your code actually reads logs:
    fn.addToRolePolicy(
      new PolicyStatement({
        effect: Effect.ALLOW,
        actions: ['logs:DescribeLogStreams', 'logs:GetLogEvents'],
        resources: [logGroupArn],
      })
    );

    // If your code calls CloudWatch metrics API:
    fn.addToRolePolicy(
      new PolicyStatement({
        effect: Effect.ALLOW,
        actions: ['cloudwatch:GetMetricStatistics'],
        resources: ['*'],
      })
    );

    // If you emit traces:
    fn.addToRolePolicy(
      new PolicyStatement({
        effect: Effect.ALLOW,
        actions: ['xray:PutTraceSegments', 'xray:PutTelemetryRecords'],
        resources: ['*'],
      })
    );
  });

  // const lambdaFn = backend.createUserHandler.resources.lambda;
  // userProfileTable.grantWriteData(createCognitoUserHandler);

  // Grant the getSettingsHandler's Lambda role read access to the systemTable
  // systemTable.grantReadData(getSettingsHandler.role!);

  // Grant the setSettingsHandler's Lambda role write access to the systemTable
  // systemTable.grantWriteData(setSettingsHandler.role!);

  // The GraphQL API ID must be obtained after the data stack is finalized.
  // const graphQLApi = backend.data.resources.graphqlApi;

  // const policySaveSettings = new Policy(
  //   Stack.of(systemTable),
  //   'SaveSettingsPolicy',
  //   {
  //     statements: [
  //       new PolicyStatement({
  //         effect: Effect.ALLOW,
  //         actions: ['dynamodb:PutItem'],
  //         resources: [systemTable.tableArn],
  //       }),
  //     ],
  //   }
  // );

  // const policyGetSetSettings = new Policy(
  //   Stack.of(systemTable),
  //   'GetSetSettingsPolicy',
  //   {
  //     statements: [
  //       new PolicyStatement({
  //         effect: Effect.ALLOW,
  //         actions: ['dynamodb:GetItem', 'dynamodb:PutItem'],
  //         resources: [systemTable.tableArn],
  //       }),
  //     ],
  //   }
  // );

  // const lambdaRole = backend.createUserHandler.resources.lambda.role!;
  // const lambdaStack = Stack.of(lambdaRole);

  // const policyCreateUser = new Policy(lambdaStack, 'createUserPolicy', {
  //   statements: [
  //     new PolicyStatement({
  //       effect: Effect.ALLOW,
  //       actions: ['dynamodb:GetItem', 'dynamodb:PutItem'],
  //       resources: [userProfileTable.tableArn],
  //     }),
  //   ],
  // });

  // lambdaRole.attachInlinePolicy(policyCreateUser);

  // const policyCreateUser = new Policy(
  //   Stack.of(userProfileTable),
  //   'createUserPolicy',
  //   {
  //     statements: [
  //       new PolicyStatement({
  //         effect: Effect.ALLOW,
  //         actions: ['dynamodb:PutItem'],
  //         resources: [userProfileTable.tableArn],
  //       }),
  //     ],
  //   }
  // );

  // const policyAuthLambda = new Policy(
  //   Stack.of(backend.getCognitoUserHandler.resources.lambda),
  //   'CommonLambdaPolicy',
  //   {
  //     statements: [
  //       new PolicyStatement({
  //         effect: Effect.ALLOW,
  //         actions: [
  //           'cloudwatch:GetMetricStatistics',
  //           'logs:DescribeLogStreams',
  //           'logs:GetLogEvents',
  //           'logs:CreateLogGroup',
  //           'logs:CreateLogStream',
  //           'logs:PutLogEvents',
  //           'xray:PutTraceSegments',
  //           'xray:PutTelemetryRecords',
  //         ],
  //         // you can lock this down to the Lambda’s log-group ARN if you prefer
  //         resources: ['*'],
  //       }),
  //     ],
  //   }
  // );

  // backend.getCognitoUserHandler.resources.lambda.role?.attachInlinePolicy(
  //   policyAuthLambda
  // );
  // backend.createCognitoUserHandler.resources.lambda.role?.attachInlinePolicy(
  //   policyAuthLambda
  // );

  // const policyAuthLambda = createCommonLambdaPolicy(
  //   Stack.of(backend.getCognitoUserHandler.resources.lambda)
  // );

  // const policyDataLambda = createCommonLambdaPolicy(
  //   Stack.of(backend.getSettingsHandler.resources.lambda)
  // );

  // backend.setSettingsHandler.resources.lambda.role?.attachInlinePolicy(
  //   policyGetSetSettings
  // );

  // Note: By using the Gen 2 Grant methods, the Lambda function role is automatically
  // configured to be invoked by the AppSync API based on the schema definition, so no
  // extra policy is needed for that part of the flow.

  // backend.createUserHandler.resources.lambda.role?.attachInlinePolicy(
  //   policyCreateUser
  // );

  // backend.getSettingsHandler.resources.lambda.role?.attachInlinePolicy(
  //   policySaveSettings
  // );
  // backend.getSettingsHandler.resources.lambda.role?.attachInlinePolicy(
  //   policyDataLambda
  // );
}
