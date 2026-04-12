export type DevBeaconExtraTabSpec =
  | {
      kind: 'trace-log-text';
      id?: 'trace';
      label?: 'Trace';
      props?: {
        endpoint?: string;
        pollMs?: number;
        tailBytes?: number;
        maxLines?: number;
        autoStart?: boolean;
        height?: string;
        autoScroll?: boolean;
        wordWrap?: 'on' | 'off';
      };
    }
  | {
      kind: 'trace-events-table';
      id?: 'trace';
      label?: 'Trace';
      props?: {
        endpoint?: string;
        pollMs?: number;
        tailBytes?: number;
        maxLines?: number;
        autoStart?: boolean;
      };
    };

// Plain logo config (serializable)
export type DevBeaconLogoSpec =
  | { kind: 'default' } // your package default icon
  | { kind: 'image'; src: string; alt?: string; sizePx?: number; priority?: boolean };
