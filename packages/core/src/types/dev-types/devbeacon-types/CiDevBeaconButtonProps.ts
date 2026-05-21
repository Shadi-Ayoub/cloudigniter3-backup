import type { CiEnvMode } from "@/types";
import type { CiDevBeaconPosition, CiDevBeaconSize } from "./";

export interface CiDevBeaconButtonProps
  extends Omit<React.ButtonHTMLAttributes<HTMLButtonElement>, "onClick"> {
  loaded: boolean;
  onClick: () => void;
  /** Corner position; you can override with positionClasses */
  // position?: keyof typeof defaultPositionClasses;
  /** Provide your own map if you already have positionClasses elsewhere */
  positionClasses?: Partial<Record<CiDevBeaconPosition, string>>;
  position?: CiDevBeaconPosition;
  /** Optional custom logo node (e.g., <Image ... />). Defaults to a simple circle */
  logo?: React.ReactNode;
  /** Affects the small status dot color */
  env?: CiEnvMode;
  /** Button & icon sizing */
  size?: CiDevBeaconSize;
  /** Accessible label; defaults to "Open Developer Dashboard" */
  ariaLabel?: string;
  /** Turn halo on/off (default true) */
  pulse?: boolean;
  /** Only pulse when content loaded (default true) */
  pulseOnlyWhenLoaded?: boolean;
  /** Override halo color class (e.g. 'bg-sky-500/40') */
  pulseClassOverride?: string;
}
