// import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
// import { DynamoDBDocumentClient, GetCommand, PutCommand } from '@aws-sdk/lib-dynamodb';
// import { deepmerge } from 'deepmerge-ts';

// import type { GetSettingsHandlerInput, Settings } from '@CI/types';
// import { settingsDefaultValues } from '@CI/settings';
// import { err, getErrorMessage, ok } from '@CI/utility';

// export async function ciGetSettingsHandler(input: GetSettingsHandlerInput) {
//   const tableName = process.env.CI_SYSTEM_TABLE_NAME!;
//   // const key = { id: { S: 'settings' } };

//   const client = new DynamoDBClient({ region: input.region });
//   const ddbDocClient = DynamoDBDocumentClient.from(client, {
//     marshallOptions: { removeUndefinedValues: true },
//   });

//   let settings: Settings;

//   const { Item } = await ddbDocClient.send(
//     new GetCommand({
//       TableName: tableName,
//       Key: { id: 'settings' },
//     })
//   );

//   if (!Item) {
//     const defaultSettings = deepmerge(settingsDefaultValues, input.extendedSettingsDefaultValues) as Settings;

//     try {
//       const nowIso = new Date().toISOString();
//       const item = {
//         id: 'settings',
//         data: JSON.stringify(defaultSettings),
//         createdAt: nowIso,
//         updatedAt: nowIso,
//       };

//       // @ts-ignore
//       const response1 = await ddbDocClient.send(
//         new PutCommand({
//           TableName: tableName,
//           Item: item,
//           ConditionExpression: 'attribute_not_exists(id)',
//         })
//       );

//       const { Item } = await ddbDocClient.send(
//         new GetCommand({
//           TableName: tableName,
//           Key: { id: 'settings' },
//         })
//       );

//       if (!Item) {
//         ddbDocClient.destroy(); // no-op
//         client.destroy(); // destroys DynamoDBClient
//         return await err(404, { error: 'Settings record not found' });
//       }

//       ddbDocClient.destroy(); // no-op
//       client.destroy(); // destroys DynamoDBClient

//       settings = Item as Settings;

//       return await ok(settings);
//     } catch (error) {
//       return await err(404, { error: getErrorMessage(error) });
//     }
//   }

//   ddbDocClient.destroy(); // no-op
//   client.destroy(); // destroys DynamoDBClient

//   settings = Item as Settings;

//   return await ok(settings);
// }
