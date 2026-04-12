export type CiMainMenuItem = {
  id: string;
  label: string;
  url?: string;
  icon?: string;
  hidden?: boolean;
  target?: '_self' | '_blank' | string;
  subMenu?: Record<string, CiMainMenuItem>;
};
