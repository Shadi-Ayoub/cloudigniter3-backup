import { z } from "zod";
import type { CiTodoCommand } from "@ci-core/types";

const fields = {
  title: z.string().trim().min(1).max(200),
  notes: z.string().max(4000),
  priority: z.enum(["low", "normal", "high"]),
  dueDate: z.iso.date().nullable(),
};
const todoCommand = z.discriminatedUnion("action", [
  z
    .object({
      action: z.literal("list"),
      nextToken: z.string().max(1000).optional(),
    })
    .strict(),
  z
    .object({ action: z.literal("create"), item: z.object(fields).strict() })
    .strict(),
  z
    .object({
      action: z.literal("save"),
      item: z
        .object({
          ...fields,
          id: z.string().regex(/^\d{13}-[a-f0-9-]{36}$/),
          completed: z.boolean(),
          deleted: z.boolean(),
          deletion: z
            .object({
              state: z.literal("deleted"),
              operationId: z.string(),
              deletedAt: z.iso.datetime(),
              deletedBy: z.string(),
              reason: z.string(),
            })
            .optional(),
          revision: z.number().int().positive(),
          createdAt: z.iso.datetime(),
          updatedAt: z.iso.datetime(),
        })
        .strict(),
    })
    .strict(),
]);

export function ciParseTodoCommand(value: unknown): CiTodoCommand {
  return todoCommand.parse(value);
}
