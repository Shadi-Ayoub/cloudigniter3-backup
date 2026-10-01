#!/usr/bin/env node
import { ciSetupGithubCli } from "../src/github-cli.mjs";

// Install hooks are best-effort: offline package work must remain available.
if (process.env.CLOUDIGNITER_SKIP_GH_INSTALL !== "1") {
  try {
    const gh = await ciSetupGithubCli();
    console.log(`dev: GitHub CLI ${gh.version} ready (${gh.source}).`);
  } catch (error) {
    console.warn(`dev: GitHub CLI setup was not completed. ${error instanceof Error ? error.message : "Setup failed."}`);
    console.warn("dev: Package maintenance remains available. Retry with dev github setup before using GitHub operations.");
  }
}
