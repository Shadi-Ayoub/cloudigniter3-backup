export type CiProfileMenuItem = {
  label: string;
  shortcut?: string;
  disabled?: boolean;
  onSelect?: () => void | Promise<void>;
};
