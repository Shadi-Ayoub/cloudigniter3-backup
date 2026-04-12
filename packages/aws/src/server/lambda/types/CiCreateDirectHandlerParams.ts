import type { CiDirectServiceFn } from "./CiDirectServiceFn";

export type CiCreateDirectHandlerParams<
  TService extends CiDirectServiceFn<any>,
> = {
  service: TService;
  handlerName?: string;
  moduleUrl?: string;
};
