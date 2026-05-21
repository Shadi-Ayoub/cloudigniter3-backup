export type CiSystemStatusItem = {
  status: 'success' | 'error' | undefined;
  message?: string;
  item?: string;
  configJson?: any;
  label?: string;
  key?: string;
};
