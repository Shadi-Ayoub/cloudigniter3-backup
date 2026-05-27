// "use client";

// import { type FC } from "react";
// import {
//   CiPageLoader,
//   type CiDashboardCardProps,
// } from "@cloudigniter/core/client";
// import { CiDashboardCard as Card, CiDashboardGrid } from "@ci-next/client";

// interface DashboardProps {
//   config: CiDashboardCardProps[];
// }

// export const CiDevToolsPage: FC<DashboardProps> = ({ config }) => {
//   // const messages = useMessages();
//   // const locale = useLocale();

//   return (
//     <>
//       <CiPageLoader />
//       {/* <NextIntlClientProvider locale={locale} messages={messages}> */}
//       <CiDashboardGrid>
//         {config.map((card, index) => (
//           <Card
//             key={index}
//             id={card.id}
//             icon={card.icon}
//             route={card.route}
//             label={card.label}
//             namespace={card.namespace}
//           />
//         ))}
//       </CiDashboardGrid>
//       {/* </NextIntlClientProvider> */}
//     </>
//   );
// };
