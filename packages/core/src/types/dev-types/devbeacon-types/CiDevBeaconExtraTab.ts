export type CiDevBeaconExtraTab = {
  id: string; // e.g. 'trace'
  label: string; // e.g. 'Trace'
  icon?: React.ComponentType<any>; // lucide icon (optional)
  content: React.ReactNode; // rendered in right pane
};
