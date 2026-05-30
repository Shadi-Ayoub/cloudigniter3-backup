// import { Amplify, type ResourcesConfig } from 'aws-amplify';
// import {
//   type AmplifyOutputs,
//   type LegacyConfig,
// } from 'aws-amplify/adapter-core';
// import { type ThemeProviderProps } from 'next-themes';
// import { getMessages } from 'next-intl/server';

// import {
//   getLangDir,
//   // getServerLocale,
//   serverStatus,
// } from '@cloudigniter/next/server';
// // import { serverStatus } from '@cloudigniter/next/server';
// import { getSettings } from './get-settings'; // cache support
// import {
//   type CloudIgniterClientConfig,
//   type CloudIgniterClientProviderConfig,
//   type CloudIgniterLayoutConfig,
//   type SystemContext,
// } from '@cloudigniter/next/types';

// import amplifyOutputs from '../../amplify_outputs.json';
// // import { dataClient } from './dataClient';
// import authenticatorProps from '../authenticator/authenticator-props';
// import authenticatorStyleTheme from '../authenticator/authenticatorStyleTheme';

// import '../app/globals.css';
// import '../authenticator/authenticator.css';
// // import '../app/authenticator.css';

// Amplify.configure(
//   amplifyOutputs as ResourcesConfig | LegacyConfig | AmplifyOutputs,
//   { ssr: true }
// );

// // const locale = await getServerLocale(); // see /i18n/request.ts
// const locale = 'en';
// const direction = await getLangDir(locale);
// // const messages = await getMessages();

// // called by the root layout
// async function Kernel() {
//   // const lang = await getServerLocale(); // see /i18n/request.ts
//   // const langDir = await getLangDir(lang);
//   const messages = await getMessages();

//   const obj = {
//     locale,
//     direction,
//     messages,
//   };

//   return obj;
// }

// export async function getClientConfig() {
//   const themeProviderProps: ThemeProviderProps = { forcedTheme: undefined };

//   const [settings, status] = await Promise.all([getSettings(), serverStatus()]);

//   const context: SystemContext = {
//     settings,
//     status,
//   };

//   const obj: CloudIgniterClientConfig = {
//     context,
//     provider: {
//       amplifyOutputs,
//       themeProviderProps,
//       authenticatorProps,
//       authenticatorStyleTheme,
//       direction,
//     } as CloudIgniterClientProviderConfig,
//     layout: {
//       context,
//       locale,
//     } as CloudIgniterLayoutConfig,
//   };

//   return obj;
// }

// export { Kernel };
