"use server";
import type { CiExtensionCommand } from "@cloudigniter/core/types";
import { appBootstrap } from "../bootstrap/app-bootstrap";
import { appModules } from "./app-modules";

export async function appListModules() {
  return appModules(await appBootstrap()).list();
}
export async function appModuleCommand(command: CiExtensionCommand) {
  return appModules(await appBootstrap()).command(command);
}
export async function appExecuteModule(id: string, input: unknown) {
  return appModules(await appBootstrap()).execute(id, input);
}
