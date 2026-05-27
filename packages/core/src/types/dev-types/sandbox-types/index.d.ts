import { type CiResponse } from "@ci-core/types";
export type CiSandboxCallbackFunction = ((inputString: string) => Promise<CiResponse>) | (() => Promise<CiResponse>);
export type CiSandboxButtonsGridConfig = {
    [groupName: string]: {
        [buttonLabel: string]: string;
    };
};
export type CiSandboxMethodDefinition = {
    id: string;
    label: string;
    callback: CiSandboxCallbackFunction;
    defaultInput: string;
    description: string;
    executionContext?: "client" | "server";
};
export type CiAsyncResponseFunction<T = CiResponse> = (...args: any[]) => Promise<T>;
export type CiGenericObject<T = any> = {
    [key: string]: T;
};
export type CiSandboxApiFunctionDefinition = {
    id: string;
    label: string;
    callback: CiAsyncResponseFunction;
    defaultInput: CiGenericObject;
    description: string;
    executionContext?: "client" | "server";
};
//# sourceMappingURL=index.d.ts.map