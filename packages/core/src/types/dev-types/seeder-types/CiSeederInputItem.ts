export type CiSeederInputItem = {
  item: string;
  seedSetId: string;
  mock?: unknown[]; // Needed when action is 'seed'. Not needed for the 'clear' action!
};
