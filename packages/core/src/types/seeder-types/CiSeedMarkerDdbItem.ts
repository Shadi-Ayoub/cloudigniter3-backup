export type CiSeedMarkerDdbItem = {
  PK: string;
  SK: string;

  type: 'SEED_MARKER';

  seedSetId: string;
  item: string; // e.g. "TENANT"

  targetPk: string;
  targetSk: string;

  seededAt: string;
  seededBy: string;

  // optional, helpful for debugging
  targetType?: string; // e.g. "TENANT"
  targetId?: string; // e.g. tenantId
};
