// "use client";

// import { useState } from "react";
// import {
//   Button,
//   Dialog,
//   DialogTrigger,
//   DialogContent,
//   DialogHeader,
//   DialogTitle,
//   ScrollArea,
//   type CiSystemStatus,
//   type CiSystemStatusItem,
// } from "@cloudigniter/core";
// import type { CiSystemStatusCheckList } from "@ci-next/status";

// // type ViewMode = 'amplifyConfig' | 'systemSettings' | null;

// const getStatusDot = (status: CiSystemStatusItem["status"]) =>
//   status === "success" ? "bg-green-500" : "bg-red-500";

// const getOverallStatusText = (status: CiSystemStatusItem["status"]) =>
//   status === "success" ? "System is healthy" : "Some system components failed!";

// interface SystemStatusDialogInterface {
//   checkList: CiSystemStatusCheckList;
// }

// export const CiSystemStatusDialog = ({
//   checkList,
// }: SystemStatusDialogInterface) => {
//   const status = checkList.status as CiSystemStatus;

//   const [viewingJson, setViewingJson] = useState<string | null>(null);

//   // Determine if 'general' exists in context.settings
//   // const hasGeneral =
//   //   context.settings &&
//   //   typeof context.settings === 'object' &&
//   //   'general' in context.settings;

//   // const settingsStatusItem: SystemStatusItem = {
//   //   status: hasGeneral ? 'success' : 'error',
//   //   label: 'System Settings',
//   //   message: hasGeneral
//   //     ? 'CloudIgniter system settings are fetched successfully'
//   //     : 'System settings unavailable',
//   // };

//   // Build typed entries array, excluding 'overall'
//   const entries: [
//     Exclude<keyof CiSystemStatus, "overall">,
//     CiSystemStatusItem,
//   ][] = Object.keys(status)
//     .filter(
//       (key): key is Exclude<keyof CiSystemStatus, "overall"> =>
//         key !== "overall",
//     )
//     .map((key) => [key, status[key]!]);

//   const amplifyConfigItem = status.amplifyConfig;
//   const systemSettingsItem = status.systemSettings;
//   const overallStatus = status.overall;
//   const overallStatusText = getOverallStatusText(overallStatus);

//   return (
//     <Dialog>
//       <DialogTrigger asChild>
//         <button
//           className="flex cursor-pointer items-center gap-2"
//           aria-label="System Status"
//         >
//           <div
//             className={`h-3 w-3 rounded-full ${getStatusDot(overallStatus)}`}
//           />
//           <span className="text-sm">{overallStatusText}</span>
//         </button>
//       </DialogTrigger>

//       <DialogContent className="max-w-2xl">
//         <DialogHeader>
//           <DialogTitle>System Status</DialogTitle>
//         </DialogHeader>

//         {viewingJson === null ? (
//           <div className="space-y-4">
//             {entries.map(([key, item]) => (
//               <div key={key} className="flex items-start gap-3">
//                 <div
//                   className={`mt-1 h-3 w-3 shrink-0 rounded-full ${getStatusDot(
//                     item.status,
//                   )}`}
//                 />
//                 <div className="flex-1">
//                   <p className="text-sm font-medium">{item.label || key}</p>
//                   <p className="text-muted-foreground text-sm">
//                     {item.message || item.item || "No details available."}
//                   </p>
//                 </div>
//                 {item.status === "success" && item.configJson && (
//                   <Button
//                     size="sm"
//                     variant="outline"
//                     onClick={() => setViewingJson(item.key as string)}
//                   >
//                     View
//                   </Button>
//                 )}
//               </div>
//             ))}

//             {/* <div key='systemSettings' className='flex items-start gap-3'>
//               <div
//                 className={`mt-1 h-3 w-3 shrink-0 rounded-full ${getStatusDot(
//                   settingsStatusItem.status
//                 )}`}
//               />
//               <div className='flex-1'>
//                 <p className='text-sm font-medium'>
//                   {settingsStatusItem.label}
//                 </p>
//                 <p className='text-muted-foreground text-sm'>
//                   {settingsStatusItem.message}
//                 </p>
//               </div>
//               {settingsStatusItem.status === 'success' && (
//                 <Button
//                   size='sm'
//                   variant='outline'
//                   onClick={() => setViewingJson('systemSettings')}
//                 >
//                   View
//                 </Button>
//               )}
//             </div> */}
//           </div>
//         ) : (
//           <div className="space-y-2">
//             <div className="flex items-center justify-between">
//               <DialogTitle className="text-sm">
//                 {viewingJson === "amplifyConfig"
//                   ? "Amplify Configuration JSON"
//                   : "System Settings JSON"}
//               </DialogTitle>
//               <Button
//                 size="sm"
//                 variant="ghost"
//                 onClick={() => setViewingJson(null)}
//               >
//                 Back
//               </Button>
//             </div>

//             <ScrollArea className="h-64 rounded-md border p-1">
//               <pre className="text-xs break-words whitespace-pre-wrap">
//                 {viewingJson === "amplifyConfig"
//                   ? amplifyConfigItem?.status === "success" &&
//                     amplifyConfigItem.configJson
//                     ? JSON.stringify(amplifyConfigItem.configJson, null, 2)
//                     : "No configuration available."
//                   : systemSettingsItem?.status === "success"
//                   ? JSON.stringify(checkList.settings, null, 2)
//                   : "No settings available."}
//               </pre>
//             </ScrollArea>
//           </div>
//         )}
//       </DialogContent>
//     </Dialog>
//   );
// };
