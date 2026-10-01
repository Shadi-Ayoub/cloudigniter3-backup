"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { ListTodo, Plus, RefreshCw } from "lucide-react";
import type {
  CiTodoCommand,
  CiTodoItem,
  CiTodoPage as TodoPage,
} from "@cloudigniter/core/types";
import type { CiExtensionPageProps } from "@ci-ui/types";
import {
  Button,
  Input,
  Label,
  Badge,
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
  Textarea,
} from "../components/shadcn";
import { CiManagementHeader } from "../components/management-header/CiManagementHeader";
import { CiAlert } from "../feedback/CiAlert";
import { CiAlertDialog } from "../feedback/CiAlertDialog";

export function CiTodoPage({ configuration, execute }: CiExtensionPageProps) {
  const [items, setItems] = useState<CiTodoItem[]>([]);
  const [nextToken, setNextToken] = useState<string>();
  const [busy, setBusy] = useState(true);
  const lock = useRef(false);
  const [error, setError] = useState<string>();
  const [notice, setNotice] = useState<string>();
  const [filter, setFilter] = useState(
    configuration.showCompleted === false ? "active" : "all",
  );
  const [search, setSearch] = useState("");
  const [editing, setEditing] = useState<CiTodoItem | "new">();
  const [title, setTitle] = useState("");
  const [notes, setNotes] = useState("");
  const [priority, setPriority] = useState<CiTodoItem["priority"]>("normal");
  const [dueDate, setDueDate] = useState("");
  const [remove, setRemove] = useState<CiTodoItem>();
  const load = useCallback(
    async (token?: string) => {
      if (lock.current) return;
      lock.current = true;
      setBusy(true);
      setError(undefined);
      try {
        const result = await execute({
          action: "list",
          ...(token ? { nextToken: token } : {}),
        });
        if (!result.ok) {
          setError(result.body.error);
          return;
        }
        const page = result.body as TodoPage;
        if (!Array.isArray(page?.items))
          throw new Error("Invalid task response.");
        setItems((previous) =>
          token
            ? [
                ...new Map(
                  [...previous, ...page.items].map((item) => [item.id, item]),
                ).values(),
              ]
            : page.items,
        );
        setNextToken(page.nextToken);
      } catch {
        setError("Unable to load tasks. Refresh to try again.");
      } finally {
        lock.current = false;
        setBusy(false);
      }
    },
    [execute],
  );
  useEffect(() => {
    void load();
  }, [load]);
  async function save(command: CiTodoCommand) {
    if (lock.current) return false;
    lock.current = true;
    setBusy(true);
    setError(undefined);
    try {
      const result = await execute(command);
      if (!result.ok) {
        setError(result.body.error);
        return false;
      }
      const item = result.body as CiTodoItem;
      setItems((previous) =>
        [item, ...previous.filter((existing) => existing.id !== item.id)].sort(
          (a, b) => b.createdAt.localeCompare(a.createdAt),
        ),
      );
      setNotice(
        item.deleted
          ? "Task moved to Trash. You can restore it."
          : "Task saved.",
      );
      return true;
    } catch {
      setError(
        "Unable to save. Refresh before retrying to check the latest task state.",
      );
      return false;
    } finally {
      lock.current = false;
      setBusy(false);
    }
  }
  const openEditor = (item: CiTodoItem | "new") => {
    setEditing(item);
    setError(undefined);
    setTitle(item === "new" ? "" : item.title);
    setNotes(item === "new" ? "" : item.notes);
    setPriority(
      item === "new"
        ? configuration.defaultPriority === "high"
          ? "high"
          : configuration.defaultPriority === "low"
            ? "low"
            : "normal"
        : item.priority,
    );
    setDueDate(item === "new" ? "" : (item.dueDate ?? ""));
  };
  const visible = items.filter(
    (item) =>
      (filter === "trash"
        ? item.deleted
        : !item.deleted &&
          (filter !== "active" || !item.completed) &&
          (filter !== "completed" || item.completed)) &&
      `${item.title} ${item.notes}`
        .toLowerCase()
        .includes(search.toLowerCase()),
  );
  return (
    <div className="space-y-5" aria-busy={busy}>
      <CiManagementHeader
        title="To-Do List"
        description="Your personal tasks, priorities, and upcoming work. Tasks are private to your account."
        titleIcon={<ListTodo />}
        titleBadge="Personal productivity"
      />
      <div className="flex flex-wrap items-end gap-3">
        <div className="min-w-40 flex-1 space-y-1">
          <Label htmlFor="todo-search">Search loaded tasks</Label>
          <Input
            id="todo-search"
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Find a task…"
          />
        </div>
        <div className="space-y-1">
          <Label htmlFor="todo-filter">View</Label>
          <select
            id="todo-filter"
            className="min-h-9 rounded-md border border-input bg-background px-3 text-foreground focus-visible:outline-ring"
            value={filter}
            onChange={(event) => setFilter(event.target.value)}
          >
            <option value="all">All tasks</option>
            <option value="active">Active</option>
            <option value="completed">Completed</option>
            <option value="trash">Trash</option>
          </select>
        </div>
        <Button variant="outline" disabled={busy} onClick={() => void load()}>
          <RefreshCw
            aria-hidden
            className={busy ? "animate-spin motion-reduce:animate-none" : ""}
          />
          Refresh
        </Button>
        <Button disabled={busy} onClick={() => openEditor("new")}>
          <Plus aria-hidden />
          New task
        </Button>
      </div>
      {error && (
        <CiAlert
          key={error}
          variant="error"
          onDismiss={() => setError(undefined)}
        >
          {error}
        </CiAlert>
      )}
      {notice && (
        <CiAlert
          key={notice}
          variant="success"
          onDismiss={() => setNotice(undefined)}
        >
          {notice}
        </CiAlert>
      )}
      {busy && (
        <p role="status" className="text-sm text-muted-foreground">
          Loading or saving tasks…
        </p>
      )}
      <ul className="space-y-3">
        {visible.map((item) => (
          <li
            key={item.id}
            className="flex flex-col gap-4 rounded-xl border border-border bg-card p-4 text-card-foreground sm:flex-row sm:items-center"
          >
            {!item.deleted && (
              <input
                type="checkbox"
                className="size-5 shrink-0 accent-primary"
                aria-label={`Mark ${item.title} ${item.completed ? "active" : "complete"}`}
                checked={item.completed}
                disabled={busy}
                onChange={(event) =>
                  void save({
                    action: "save",
                    item: { ...item, completed: event.target.checked },
                  })
                }
              />
            )}
            <div className="min-w-0 flex-1">
              <h2
                className={`break-words font-medium ${item.completed ? "text-muted-foreground line-through" : ""}`}
              >
                {item.title}
              </h2>
              {item.notes && (
                <p className="mt-1 whitespace-pre-wrap break-words text-sm text-muted-foreground">
                  {item.notes}
                </p>
              )}
              <div className="mt-2 flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
                <Badge variant="secondary" className="capitalize">
                  {item.priority} priority
                </Badge>
                {item.dueDate && (
                  <span>
                    Due <time dateTime={item.dueDate}>{item.dueDate}</time>
                  </span>
                )}
                {item.completed && <span>Completed</span>}
              </div>
            </div>
            <div className="flex shrink-0 flex-wrap gap-2">
              {item.deleted ? (
                <Button
                  variant="outline"
                  disabled={busy}
                  onClick={() =>
                    void save({
                      action: "save",
                      item: { ...item, deleted: false },
                    })
                  }
                >
                  Restore
                </Button>
              ) : (
                <>
                  <Button
                    variant="outline"
                    disabled={busy}
                    onClick={() => openEditor(item)}
                  >
                    Edit
                  </Button>
                  <Button
                    variant="outline"
                    disabled={busy}
                    onClick={() => setRemove(item)}
                  >
                    Move to Trash
                  </Button>
                </>
              )}
            </div>
          </li>
        ))}
      </ul>
      {!visible.length && !busy && (
        <div className="rounded-xl border border-dashed border-border p-10 text-center text-muted-foreground">
          {items.length
            ? "No loaded tasks match this view."
            : "No tasks yet. Add your first task to get started."}
        </div>
      )}
      {nextToken && (
        <Button
          variant="outline"
          disabled={busy}
          onClick={() => void load(nextToken)}
        >
          Load more tasks
        </Button>
      )}
      <Dialog
        open={!!editing}
        onOpenChange={(open) => {
          if (!open && !busy) setEditing(undefined);
        }}
      >
        <DialogContent showCloseButton={!busy} className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>
              {editing === "new" ? "New task" : "Edit task"}
            </DialogTitle>
            <DialogDescription>
              Give your task a title. Notes and a due date are optional.
            </DialogDescription>
          </DialogHeader>
          <form
            className="space-y-4"
            onSubmit={async (event) => {
              event.preventDefault();
              const fields = {
                title,
                notes,
                priority,
                dueDate: dueDate || null,
              };
              const success = await save(
                editing === "new"
                  ? { action: "create", item: fields }
                  : { action: "save", item: { ...editing!, ...fields } },
              );
              if (success) {
                if (editing === "new") {
                  setFilter("all");
                  setSearch("");
                }
                setEditing(undefined);
              }
            }}
          >
            <div className="space-y-1">
              <Label htmlFor="todo-title">Title</Label>
              <Input
                id="todo-title"
                autoFocus
                required
                maxLength={200}
                value={title}
                onChange={(event) => setTitle(event.target.value)}
                disabled={busy}
              />
            </div>
            <div className="space-y-1">
              <Label htmlFor="todo-notes">Notes</Label>
              <Textarea
                id="todo-notes"
                maxLength={4000}
                value={notes}
                onChange={(event) => setNotes(event.target.value)}
                disabled={busy}
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1">
                <Label htmlFor="todo-priority">Priority</Label>
                <select
                  id="todo-priority"
                  className="min-h-10 w-full rounded-md border border-input bg-background px-3 text-foreground"
                  value={priority}
                  onChange={(event) =>
                    setPriority(event.target.value as CiTodoItem["priority"])
                  }
                  disabled={busy}
                >
                  <option value="high">High</option>
                  <option value="low">Low</option>
                  <option value="normal">Normal</option>
                </select>
              </div>
              <div className="space-y-1">
                <Label htmlFor="todo-due">Due date</Label>
                <Input
                  id="todo-due"
                  type="date"
                  value={dueDate}
                  onChange={(event) => setDueDate(event.target.value)}
                  disabled={busy}
                />
              </div>
            </div>
            {error && (
              <p role="alert" className="text-danger">
                {error}
              </p>
            )}
            <DialogFooter>
              <Button type="submit" disabled={busy || !title.trim()}>
                {busy ? "Saving…" : "Save task"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
      <CiAlertDialog
        open={!!remove}
        onOpenChange={(open) => {
          if (!open) setRemove(undefined);
        }}
        variant="warning"
        title="Move task to Trash?"
        description="The task will be hidden from your active list. You can restore it from the Trash view."
        confirmLabel="Move to Trash"
        pending={busy}
        closeOnConfirm={false}
        onConfirm={async () => {
          if (
            remove &&
            (await save({ action: "save", item: { ...remove, deleted: true } }))
          )
            setRemove(undefined);
        }}
      >
        {error && (
          <p role="alert" className="text-danger">
            {error}
          </p>
        )}
      </CiAlertDialog>
    </div>
  );
}
