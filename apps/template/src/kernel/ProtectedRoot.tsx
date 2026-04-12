// import { type PropsWithChildren } from 'react';
// import { Inter } from 'next/font/google';

// import { cookies } from 'next/headers';
// import {
//   generateServerClientUsingCookies,
//   type ClientUsingSSRCookies,
// } from '@aws-amplify/adapter-nextjs/data';

// import type { CI_AmplifyOutputs } from '@cloudigniter/next/types';

// import outputs from '@/../amplify_outputs.json';
// import type { Schema } from '@/../amplify/data/resource';
// import { CloudIgniterServerWrapper } from '@cloudigniter/next';

// // import { getServerStatus, getSettings } from '@/kernel/server';
// import { bootstrap } from '@/kernel/server'; // a must

// import './globals.css';

// export const dynamic = 'force-dynamic';

// const inter = Inter({ subsets: ['latin'] });

// const config = outputs as CI_AmplifyOutputs;

// // export const metadata = {
// //   icons: {
// //     icon: '/favicon.ico',
// //     shortcut: '/favicon.ico',
// //   },
// // };

// export async function ProtectedRoot({ children }: PropsWithChildren) {
//   // const settings = await getSettings();
//   // const status = await getServerStatus(settings);

//   // const amplifyClient = generateServerClientUsingCookies<Schema>({
//   //   config,
//   //   cookies,
//   // }) as ClientUsingSSRCookies<Schema>;

//   const setup = await bootstrap();

//   return (
//     <html
//       lang={setup.context.locale}
//       dir={setup.context.direction}
//       suppressHydrationWarning
//     >
//       <body className={`${inter.className}`}>
//         <CloudIgniterServerWrapper config={setup.serverConfig}>
//           {children}
//         </CloudIgniterServerWrapper>
//       </body>
//     </html>
//   );
// }
