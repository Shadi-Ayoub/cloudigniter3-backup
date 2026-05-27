import type { CiSeederAction } from './CiSeederAction';
import type { CiSeederItemKey } from './CiSeederItemKey';

export type CiSeederInput = {
  action: CiSeederAction;
  items: CiSeederItemKey[];
};
