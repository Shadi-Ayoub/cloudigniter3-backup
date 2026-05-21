// Plain logo config (serializable)
export type CiDevBeaconLogoSpec =
  | { kind: "default" } // your package default icon
  | {
      kind: "image";
      src: string;
      alt?: string;
      sizePx?: number;
      priority?: boolean;
    };
