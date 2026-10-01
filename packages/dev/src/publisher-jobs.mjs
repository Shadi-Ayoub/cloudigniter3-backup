import { execa } from "execa";
import { randomUUID } from "node:crypto";
import { stripVTControlCharacters } from "node:util";
import { ciIsRecord } from "./policy.mjs";
import { CiDevUsageError } from "./runtime.mjs";

/** @param {string} text */
export function ciPublisherRedact(text) {
  let clean = stripVTControlCharacters(text);
  for (const [key, value] of Object.entries(process.env))
    if (
      /(TOKEN|SECRET|PASSWORD|ACCESS_KEY)/i.test(key) &&
      value &&
      value.length >= 8
    )
      clean = clean.split(value).join("[REDACTED]");
  return clean
    .replace(
      /(?:gh[pousr]_[A-Za-z0-9_]+|github_pat_[A-Za-z0-9_]+|npm_[A-Za-z0-9]+|AKIA[A-Z0-9]{16})/g,
      "[REDACTED]",
    )
    .replace(
      /((?:token|password|secret|authorization)["']?\s*[:=]\s*["']?)[^\s,"'}]+/gi,
      "$1[REDACTED]",
    );
}

export class CiPublisherJobs {
  /** @type {import('./publisher-types.d.mts').PublisherJob[]} */ jobs = [];
  /** @type {import('execa').ResultPromise | undefined} */ child;
  /** @type {NodeJS.Timeout | undefined} */ killTimer;
  busy() {
    return this.jobs.some((j) => !j.finishedAt);
  }
  /** @param {import('./publisher-types.d.mts').PublisherPlan} plan */
  start(plan) {
    if (this.busy())
      throw new CiDevUsageError(
        "Another action is running. Wait or cancel it first.",
      );
    const job = /** @type {import('./publisher-types.d.mts').PublisherJob} */ ({
      ...plan,
      id: randomUUID(),
      status: "running",
      startedAt: new Date().toISOString(),
      log: "",
    });
    this.jobs.unshift(job);
    this.jobs.splice(30);
    void this.run(job);
    return job;
  }
  /** @param {string} id */
  cancel(id) {
    const job = this.jobs.find((j) => j.id === id && j.status === "running");
    if (!job) throw new CiDevUsageError("This action is no longer running.");
    job.status = "cancelled";
    this.kill("SIGTERM");
    this.killTimer = setTimeout(() => this.kill("SIGKILL"), 3000);
    this.killTimer.unref();
  }
  /** @param {NodeJS.Signals} signal */
  kill(signal) {
    if (!this.child?.pid) return;
    try {
      if (process.platform !== "win32") process.kill(-this.child.pid, signal);
      else this.child.kill(signal);
    } catch {
      /* Already exited. */
    }
  }
  /** @param {import('./publisher-types.d.mts').PublisherJob} job */
  async run(job) {
    try {
      for (const command of job.commands) {
        if (job.status === "cancelled") break;
        job.log += ciPublisherRedact(
          `$ ${command.command} ${command.args.join(" ")}\n`,
        );
        this.child = execa(command.command, command.args, {
          cwd: command.cwd,
          shell: false,
          preferLocal: false,
          detached: process.platform !== "win32",
          stdin: "ignore",
          stdout: "pipe",
          stderr: "pipe",
          buffer: false,
          reject: false,
          env: {
            ...command.env,
            CI: "1",
            FORCE_COLOR: "0",
            NO_COLOR: "1",
            GH_PROMPT_DISABLED: "1",
            GIT_TERMINAL_PROMPT: "0",
          },
        });
        // Retain complete lines before redaction, so credentials split across chunks stay hidden.
        const readers = [this.child.stdout, this.child.stderr].map(
          async (stream) => {
            if (!stream) return;
            stream.setEncoding("utf8");
            let pending = "";
            for await (const chunk of stream) {
              pending += String(chunk);
              const end = Math.max(
                pending.lastIndexOf("\n"),
                pending.lastIndexOf("\r"),
              );
              if (end >= 0) {
                job.log = (
                  job.log + ciPublisherRedact(pending.slice(0, end + 1))
                ).slice(-500_000);
                pending = pending.slice(end + 1);
              }
              if (pending.length > 64_000) {
                job.log += "\n[Oversized output line omitted]\n";
                pending = "";
              }
            }
            job.log = (job.log + ciPublisherRedact(pending)).slice(-500_000);
          },
        );
        const [result] = await Promise.all([this.child, Promise.all(readers)]);
        job.exitCode = result.exitCode ?? 1;
        if (job.exitCode !== 0) break;
      }
      if (job.status !== "cancelled")
        job.status = job.exitCode === 0 ? "succeeded" : "failed";
    } catch (error) {
      job.log += `\n${ciPublisherRedact(error instanceof Error ? error.message : String(error))}`;
      if (job.status !== "cancelled") job.status = "failed";
      job.exitCode =
        ciIsRecord(error) && typeof error.exitCode === "number"
          ? error.exitCode
          : 1;
    } finally {
      this.child = undefined;
      clearTimeout(this.killTimer);
      job.finishedAt = new Date().toISOString();
    }
  }
}
