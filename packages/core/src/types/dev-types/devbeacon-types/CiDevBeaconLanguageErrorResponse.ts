export interface CiDevBeaconLanguageErrorResponse {
  error: {
    title: string;
    message: string;
    severity?: string;
    showRetry?: boolean;
  };
}
