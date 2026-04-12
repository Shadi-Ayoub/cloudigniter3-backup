export type CiUseLogoutResult = {
  ciLogout: () => Promise<void>;
  ciIsLoggingOut: boolean;
  ciLogoutError: unknown;
};
