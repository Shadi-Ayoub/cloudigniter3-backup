// // import { resolveAmplifyOutputs } from './resolve-amplify-outputs';
// // import type { ClientUsingSSRCookies } from '@aws-amplify/adapter-nextjs/api';
// import type {
//   CiAmplifyOutputs,
//   // ServerConfig,
//   SystemStatus,
//   SystemStatusItem,
//   CiSettings,
// } from '../types';
// // import type { Schema } from 'amplify-schema';

// // import { createServer } from '../server';

// // const amplifyConfig = resolveAmplifyOutputs();

// export const getServerStatus = async (settings: CiSettings, amplifyConfig: CiAmplifyOutputs, isOk: boolean) => {
//   const amplifyConfigStatus = amplifyOutputsStatus(amplifyConfig);

//   const schemaStatus = await amplifySchemaStatus(isOk);

//   const settingsStatus = systemSettingsStatus(settings);

//   const systemStatus: SystemStatus = {
//     overall: 'success',
//     amplifyConfig: amplifyConfigStatus,
//     amplifySchema: schemaStatus,
//     systemSettings: settingsStatus,
//   };

//   const status = getOverallStatus(systemStatus);

//   systemStatus.overall = status;

//   return systemStatus;
// };

// // For displaying status list in the dialog.
// // export const getStatusItems = () => {
// //   const statusItems = [
// //     {
// //       key: 'amplifyConfig',
// //       label: 'Amplify Configuration',
// //       item: amplifyConfigStatus,
// //     },
// //     {
// //       key: 'amplifySchema',
// //       label: 'Amplify Schema Reference',
// //       item: amplifyConfigStatus,
// //     },
// //   ];
// //   return statusItems;
// // };

// export function amplifyOutputsStatus(amplifyConfig: CiAmplifyOutputs): SystemStatusItem {
//   if (amplifyConfig) {
//     return {
//       status: 'success',
//       message: 'CloudIgniter loaded the Amplify backend configurations successfully.',
//       item: JSON.stringify(amplifyConfig),
//       configJson: amplifyConfig,
//       key: 'amplifyConfig',
//       label: 'Amplify Outputs Configuration',
//     };
//   }

//   return {
//     status: 'error',
//     message: 'amplify_outputs.json not found in known paths',
//   };
// }

// // const outputs = resolveAmplifyOutputs();

// // if (outputs == null) {
// //   throw new Error(
// //     '@cloudigniter could not load the Amplify outputs JSON file!'
// //   );
// // }

// export async function amplifySchemaStatus(isOk: boolean): Promise<SystemStatusItem> {
//   // if (amplifyConfig === null) {
//   //   throw new Error(
//   //     '@cloudigniter could not create a server based on null configurations!'
//   //   );
//   // }
//   // const serverConfig: ServerConfig = {
//   //   outputs: amplifyConfig,
//   // };
//   // const server = await createServer<Schema>(serverConfig);

//   if (isOk) {
//     return {
//       status: 'success',
//       message: 'CloudIgniter could reference Amplify backend Schema type successfully.',
//       key: 'amplifySchema',
//       label: 'Amplify Schema',
//     };
//   }

//   return {
//     status: 'error',
//     message: 'Amplify Schema was not resolved',
//   };
// }

// export function systemSettingsStatus(settings: CiSettings): SystemStatusItem {
//   const isValid = settings && typeof settings === 'object' && 'general' in settings;

//   if (isValid) {
//     return {
//       status: 'success',
//       message: 'CloudIgniter system settings are fetched successfully.',
//       item: JSON.stringify(settings),
//       configJson: settings,
//       key: 'systemSettings',
//       label: 'System Settings',
//     };
//   }

//   return {
//     status: 'error',
//     message: 'System settings unavailable',
//   };
// }

// const getOverallStatus = (items: SystemStatus): SystemStatusItem['status'] => {
//   return Object.entries(items)
//     .filter(([key]) => key !== 'overall')
//     .some(([, value]) => typeof value === 'object' && value !== null && 'status' in value && value.status === 'error')
//     ? 'error'
//     : 'success';
// };

// // export const serverStatusCheck = async () => {
// //   const systemStatus = await getServerStatus();
// //   const status = getOverallStatus(systemStatus);
// //   if (status == 'error') {
// //     throw new Error('@cloudigniter server status is bad!!!');
// //   }
// // };
