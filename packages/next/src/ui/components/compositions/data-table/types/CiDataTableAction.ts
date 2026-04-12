export type CiDataTableAction<TData> = {
  id: string;
  label: string;
  icon?: React.ReactNode;
  variant?: 'default' | 'destructive';
  isVisible?: (row: TData) => boolean;
  isDisabled?: (row: TData) => boolean;
  onSelect: (row: TData) => void | Promise<void>;
};
