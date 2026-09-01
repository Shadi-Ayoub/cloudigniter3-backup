"use client";

import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  type KeyboardEvent as ReactKeyboardEvent,
  type PointerEvent as ReactPointerEvent,
  type ReactNode,
  type CSSProperties,
} from "react";
import { ContextMenu as ContextMenuPrimitive } from "radix-ui";
import {
  Archive,
  Building2,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  ChevronsDownUp,
  ChevronsUpDown,
  CircleEllipsis,
  CirclePause,
  CirclePlay,
  DatabaseZap,
  GitFork,
  GripVertical,
  LoaderCircle,
  Pencil,
  Plus,
  Search,
  Share2,
  Trash2,
} from "lucide-react";
import type {
  CiCreateOrgUnitInput,
  CiOrgUnitManagementRow,
  CiOrgUnitStatus,
  CiTenantHtmlTableRow,
  CiUpdateOrgUnitInput,
} from "@cloudigniter/core/types";
import type { CiOrgUnitManagementPageProps } from "../../types";
import { ciFormatDateTime } from "../../lib/ci-format-date-time";
import {
  CiSearchableChipMultiSelect,
  type CiSearchableChipOption,
} from "../components/searchable-chip-multi-select";
import {
  CiAlert,
  CiAlertDialog,
  ciNormalizeClientThrownError,
} from "../feedback";
import {
  Badge,
  Button,
  CiNewResourceBadge,
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
  Input,
  Label,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
  Textarea,
  cn,
} from "../components";

const ALL = "__all__";
const MIN_TREE_WIDTH = 240;
const MAX_TREE_WIDTH = 560;
const DEFAULT_TREE_WIDTH = 336;
const TREE_WIDTH_KEY = "cloudigniter-org-unit-tree-pane-width";
const ROOT_DROP_TARGET = "__ci_org_unit_root__";
const POINTER_DRAG_ACTIVATION_DISTANCE = 6;

type EditorDraft = {
  mode: "create" | "edit";
  target: CiOrgUnitManagementRow | null;
  parent: CiOrgUnitManagementRow | null;
  orgUnitId: string;
  name: string;
  slug: string;
  description: string;
  status: CiOrgUnitStatus;
  tenantIds: string[];
};

type TreeEntry = { row: CiOrgUnitManagementRow; depth: number };
type LifecycleIntent = {
  row: CiOrgUnitManagementRow;
  status: Extract<CiOrgUnitStatus, "suspended" | "archived">;
};
type MoveIntent = {
  row: CiOrgUnitManagementRow;
  newParent: CiOrgUnitManagementRow | null;
};
type PointerDragSession = {
  pointerId: number;
  rowId: string;
  startX: number;
  startY: number;
  active: boolean;
};

/** Resolves a pointer drop into the moved row and its requested new parent. */
export function ciResolveOrgUnitDropDestination(
  rows: readonly CiOrgUnitManagementRow[],
  draggedId: string | null,
  dropTargetId: string | null,
): MoveIntent | null {
  if (!draggedId || !dropTargetId) return null;
  const byId = new Map(rows.map((row) => [row.orgUnitId, row]));
  const row = byId.get(draggedId);
  if (!row) return null;
  if (dropTargetId === ROOT_DROP_TARGET) return { row, newParent: null };
  const newParent = byId.get(dropTargetId);
  return newParent ? { row, newParent } : null;
}

function statusClassName(status: CiOrgUnitStatus): string {
  return status === "active"
    ? "border-success-border bg-success-surface text-success-surface-foreground"
    : status === "suspended"
      ? "border-danger-border bg-danger-surface text-danger-surface-foreground"
      : "border-warning-border bg-warning-surface text-warning-surface-foreground";
}

function statusLabel(status: CiOrgUnitStatus): string {
  return status === "active"
    ? "Active"
    : status === "suspended"
      ? "Suspended"
      : "Archived";
}

function statusDotClassName(status: CiOrgUnitStatus): string {
  return status === "active"
    ? "bg-success-surface-foreground"
    : status === "suspended"
      ? "bg-danger-surface-foreground"
      : "bg-warning-surface-foreground";
}

function clampWidth(width: number): number {
  return Math.min(MAX_TREE_WIDTH, Math.max(MIN_TREE_WIDTH, width));
}

/** Returns only selectable, not-yet-attached tenants for the current parent. */
export function ciGetAvailableOrgUnitTenantOptions(
  tenants: readonly CiTenantHtmlTableRow[],
  parentTenantIds: readonly string[] | null,
  selectedTenantIds: readonly string[],
): CiSearchableChipOption[] {
  const allowedTenantIds = parentTenantIds ? new Set(parentTenantIds) : null;
  const selectedIds = new Set(selectedTenantIds);
  return tenants
    .filter(
      (tenant) =>
        !selectedIds.has(tenant.tenantId) &&
        (!allowedTenantIds || allowedTenantIds.has(tenant.tenantId)),
    )
    .map((tenant) => ({
      id: tenant.tenantId,
      label: tenant.name,
      description: `Tenant ID: ${tenant.tenantId}`,
    }))
    .sort((left, right) => left.label.localeCompare(right.label));
}

/** Applies the authoritative moved root and the provider's deterministic subtree rewrite locally. */
export function ciApplyOrgUnitMutation(
  rows: readonly CiOrgUnitManagementRow[],
  before: CiOrgUnitManagementRow,
  saved: CiOrgUnitManagementRow,
): CiOrgUnitManagementRow[] {
  const moved =
    before.parentId !== saved.parentId || before.path !== saved.path;
  if (!moved) {
    return rows.map((row) => (row.orgUnitId === saved.orgUnitId ? saved : row));
  }
  return rows.map((row) => {
    if (row.orgUnitId === saved.orgUnitId) return saved;
    if (row.orgUnitId === before.parentId) {
      return {
        ...row,
        childIds: row.childIds.filter((id) => id !== saved.orgUnitId),
        updatedAt: saved.updatedAt,
        version: row.version + 1,
      };
    }
    if (row.orgUnitId === saved.parentId) {
      return {
        ...row,
        childIds: [...new Set([...row.childIds, saved.orgUnitId])],
        updatedAt: saved.updatedAt,
        version: row.version + 1,
      };
    }
    const rootIndex = row.ancestorOrgUnitIds.indexOf(before.orgUnitId);
    if (rootIndex < 0) return row;
    return {
      ...row,
      path: `${saved.path}${row.path.slice(before.path.length)}`,
      ancestorOrgUnitIds: [
        ...saved.ancestorOrgUnitIds,
        saved.orgUnitId,
        ...row.ancestorOrgUnitIds.slice(rootIndex + 1),
      ],
      updatedAt: saved.updatedAt,
      version: row.version + 1,
    };
  });
}

function DropdownActions({
  row,
  onCreateChild,
  onEdit,
  onActivate,
  onSuspend,
  onArchive,
}: {
  row: CiOrgUnitManagementRow;
  onCreateChild: () => void;
  onEdit: () => void;
  onActivate: () => void;
  onSuspend: () => void;
  onArchive: () => void;
}) {
  return (
    <>
      <DropdownMenuItem onSelect={onCreateChild}>
        <Plus aria-hidden />
        Create child Org Unit
      </DropdownMenuItem>
      <DropdownMenuItem onSelect={onEdit}>
        <Pencil aria-hidden />
        Edit Org Unit
      </DropdownMenuItem>
      <DropdownMenuSeparator />
      {row.status === "suspended" ? (
        <DropdownMenuItem onSelect={onActivate}>
          <CirclePlay aria-hidden />
          Activate Org Unit
        </DropdownMenuItem>
      ) : row.status === "active" ? (
        <DropdownMenuItem onSelect={onSuspend}>
          <CirclePause aria-hidden />
          Suspend Org Unit
        </DropdownMenuItem>
      ) : null}
      {row.status !== "archived" ? (
        <DropdownMenuItem
          className="text-destructive focus:text-destructive"
          onSelect={onArchive}
        >
          <Archive aria-hidden />
          Archive Org Unit
        </DropdownMenuItem>
      ) : null}
    </>
  );
}

function ContextActions(props: {
  row: CiOrgUnitManagementRow;
  onCreateChild: () => void;
  onEdit: () => void;
  onActivate: () => void;
  onSuspend: () => void;
  onArchive: () => void;
}) {
  const itemClass =
    "relative flex min-h-10 cursor-default select-none items-center gap-2 rounded-sm px-2 py-1.5 text-sm outline-none focus:bg-accent focus:text-accent-foreground";
  return (
    <>
      <ContextMenuPrimitive.Item
        className={itemClass}
        onSelect={props.onCreateChild}
      >
        <Plus className="size-4" aria-hidden />
        Create child Org Unit
      </ContextMenuPrimitive.Item>
      <ContextMenuPrimitive.Item className={itemClass} onSelect={props.onEdit}>
        <Pencil className="size-4" aria-hidden />
        Edit Org Unit
      </ContextMenuPrimitive.Item>
      <ContextMenuPrimitive.Separator className="-mx-1 my-1 h-px bg-border" />
      {props.row.status === "suspended" ? (
        <ContextMenuPrimitive.Item
          className={itemClass}
          onSelect={props.onActivate}
        >
          <CirclePlay className="size-4" aria-hidden />
          Activate Org Unit
        </ContextMenuPrimitive.Item>
      ) : props.row.status === "active" ? (
        <ContextMenuPrimitive.Item
          className={itemClass}
          onSelect={props.onSuspend}
        >
          <CirclePause className="size-4" aria-hidden />
          Suspend Org Unit
        </ContextMenuPrimitive.Item>
      ) : null}
      {props.row.status !== "archived" ? (
        <ContextMenuPrimitive.Item
          className={cn(
            itemClass,
            "text-destructive focus:bg-destructive/10 focus:text-destructive",
          )}
          onSelect={props.onArchive}
        >
          <Archive className="size-4" aria-hidden />
          Archive Org Unit
        </ContextMenuPrimitive.Item>
      ) : null}
    </>
  );
}

export function CiOrgUnitManagementPage({
  orgUnits,
  tenants,
  canManage,
  direction = "ltr",
  locale = "en-US",
  onCreate,
  onUpdate,
  developmentSeeder,
}: CiOrgUnitManagementPageProps) {
  const [rows, setRows] = useState(orgUnits);
  const [expanded, setExpanded] = useState<Set<string>>(
    () => new Set(orgUnits.map((row) => row.orgUnitId)),
  );
  const [selectedId, setSelectedId] = useState<string | null>(
    () => orgUnits[0]?.orgUnitId ?? null,
  );
  const [searchValue, setSearchValue] = useState("");
  const [tenantFilter, setTenantFilter] = useState(ALL);
  const [statusFilter, setStatusFilter] = useState(ALL);
  const [treeWidth, setTreeWidth] = useState(DEFAULT_TREE_WIDTH);
  const [resizing, setResizing] = useState(false);
  const [draft, setDraft] = useState<EditorDraft | null>(null);
  const [pending, setPending] = useState(false);
  const [pendingActionId, setPendingActionId] = useState<string | null>(null);
  const [lifecycleIntent, setLifecycleIntent] =
    useState<LifecycleIntent | null>(null);
  const [moveIntent, setMoveIntent] = useState<MoveIntent | null>(null);
  const [draggedId, setDraggedId] = useState<string | null>(null);
  const [dropTargetId, setDropTargetId] = useState<string | null>(null);
  const [seederOpen, setSeederOpen] = useState(false);
  const [seederPending, setSeederPending] = useState<"seed" | "cleanup" | null>(
    null,
  );
  const [cleanupOpen, setCleanupOpen] = useState(false);
  const [feedback, setFeedback] = useState<{
    ok: boolean;
    message: string;
  } | null>(null);
  const [seederFeedback, setSeederFeedback] = useState<{
    ok: boolean;
    message: string;
  } | null>(null);
  const itemRefs = useRef(new Map<string, HTMLDivElement>());
  const pointerDragRef = useRef<PointerDragSession | null>(null);
  const suppressMoveHandleClickRef = useRef(false);
  const resizeStart = useRef({ clientX: 0, width: DEFAULT_TREE_WIDTH });
  const currentTreeWidth = useRef(DEFAULT_TREE_WIDTH);

  useEffect(() => {
    const saved = Number(window.localStorage.getItem(TREE_WIDTH_KEY));
    if (Number.isFinite(saved) && saved > 0) {
      const width = clampWidth(saved);
      currentTreeWidth.current = width;
      setTreeWidth(width);
    }
  }, []);

  useEffect(() => {
    if (!resizing) return;
    const move = (event: PointerEvent) => {
      const delta = event.clientX - resizeStart.current.clientX;
      const width = clampWidth(
        resizeStart.current.width + (direction === "rtl" ? -delta : delta),
      );
      currentTreeWidth.current = width;
      setTreeWidth(width);
    };
    const stop = () => {
      window.localStorage.setItem(
        TREE_WIDTH_KEY,
        String(currentTreeWidth.current),
      );
      setResizing(false);
    };
    window.addEventListener("pointermove", move);
    window.addEventListener("pointerup", stop, { once: true });
    document.body.style.cursor = "col-resize";
    document.body.style.userSelect = "none";
    return () => {
      window.removeEventListener("pointermove", move);
      window.removeEventListener("pointerup", stop);
      document.body.style.cursor = "";
      document.body.style.userSelect = "";
    };
  }, [direction, resizing]);

  const tenantNames = useMemo(
    () => new Map(tenants.map((tenant) => [tenant.tenantId, tenant.name])),
    [tenants],
  );
  const tenantOptions = useMemo(
    () =>
      tenants
        .map((tenant) => ({ id: tenant.tenantId, label: tenant.name }))
        .sort((left, right) => left.label.localeCompare(right.label)),
    [tenants],
  );
  const rowById = useMemo(
    () => new Map(rows.map((row) => [row.orgUnitId, row])),
    [rows],
  );
  const childrenByParent = useMemo(() => {
    const map = new Map<string | null, CiOrgUnitManagementRow[]>();
    for (const row of rows) {
      const parentId =
        row.parentId && rowById.has(row.parentId) ? row.parentId : null;
      const children = map.get(parentId) ?? [];
      children.push(row);
      map.set(parentId, children);
    }
    for (const children of map.values()) {
      children.sort((left, right) => left.name.localeCompare(right.name));
    }
    return map;
  }, [rowById, rows]);

  const filtering =
    Boolean(searchValue.trim()) || tenantFilter !== ALL || statusFilter !== ALL;
  const includedIds = useMemo(() => {
    if (!filtering) return new Set(rows.map((row) => row.orgUnitId));
    const query = searchValue.trim().toLocaleLowerCase();
    const ids = new Set<string>();
    for (const row of rows) {
      const searchMatch =
        !query ||
        [row.name, row.orgUnitId, row.path].some((value) =>
          value.toLocaleLowerCase().includes(query),
        ) ||
        row.tenantIds.some((id) =>
          (tenantNames.get(id) ?? id).toLocaleLowerCase().includes(query),
        );
      const tenantMatch =
        tenantFilter === ALL || row.tenantIds.includes(tenantFilter);
      const statusMatch = statusFilter === ALL || row.status === statusFilter;
      if (!searchMatch || !tenantMatch || !statusMatch) continue;
      ids.add(row.orgUnitId);
      row.ancestorOrgUnitIds.forEach((id) => ids.add(id));
    }
    return ids;
  }, [filtering, rows, searchValue, statusFilter, tenantFilter, tenantNames]);

  const treeEntries = useMemo(() => {
    const entries: TreeEntry[] = [];
    const visited = new Set<string>();
    const visit = (row: CiOrgUnitManagementRow, depth: number) => {
      if (visited.has(row.orgUnitId) || !includedIds.has(row.orgUnitId)) return;
      visited.add(row.orgUnitId);
      entries.push({ row, depth });
      if (!filtering && !expanded.has(row.orgUnitId)) return;
      (childrenByParent.get(row.orgUnitId) ?? []).forEach((child) =>
        visit(child, depth + 1),
      );
    };
    (childrenByParent.get(null) ?? []).forEach((root) => visit(root, 0));
    return entries;
  }, [childrenByParent, expanded, filtering, includedIds]);

  const selected = selectedId ? (rowById.get(selectedId) ?? null) : null;
  const activeDraggedRow = draggedId ? (rowById.get(draggedId) ?? null) : null;
  const selectedParent = selected?.parentId
    ? (rowById.get(selected.parentId) ?? null)
    : null;
  const selectedAncestors = selected
    ? selected.ancestorOrgUnitIds
        .map((id) => rowById.get(id))
        .filter((row): row is CiOrgUnitManagementRow => Boolean(row))
    : [];

  useEffect(() => {
    if (selectedId && rowById.has(selectedId)) return;
    setSelectedId(treeEntries[0]?.row.orgUnitId ?? rows[0]?.orgUnitId ?? null);
  }, [rowById, rows, selectedId, treeEntries]);

  const openCreate = useCallback((parent: CiOrgUnitManagementRow | null) => {
    setDraft({
      mode: "create",
      target: null,
      parent,
      orgUnitId: "",
      name: "",
      slug: "",
      description: "",
      status: "active",
      tenantIds: parent ? [...parent.tenantIds] : [],
    });
  }, []);

  const openEdit = useCallback(
    (row: CiOrgUnitManagementRow) => {
      setDraft({
        mode: "edit",
        target: row,
        parent: row.parentId ? (rowById.get(row.parentId) ?? null) : null,
        orgUnitId: row.orgUnitId,
        name: row.name,
        slug: row.slug,
        description: row.description ?? "",
        status: row.status,
        tenantIds: [...row.tenantIds],
      });
    },
    [rowById],
  );

  const toggleExpanded = useCallback((id: string) => {
    setExpanded((current) => {
      const next = new Set(current);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }, []);

  const validateMove = useCallback(
    (
      row: CiOrgUnitManagementRow,
      newParent: CiOrgUnitManagementRow | null,
    ): string | null => {
      if ((newParent?.orgUnitId ?? null) === row.parentId) {
        return "The Org Unit already has this parent.";
      }
      if (
        newParent?.orgUnitId === row.orgUnitId ||
        newParent?.ancestorOrgUnitIds.includes(row.orgUnitId)
      ) {
        return "An Org Unit cannot be moved below itself or one of its descendants.";
      }
      const missingTenant = row.tenantIds.find(
        (tenantId) => newParent && !newParent.tenantIds.includes(tenantId),
      );
      return missingTenant
        ? `The target parent is not attached to ${tenantNames.get(missingTenant) ?? missingTenant}. Edit the Org Unit to adjust its tenant attachments first.`
        : null;
    },
    [tenantNames],
  );

  const resolvePointerDropTarget = useCallback(
    (clientX: number, clientY: number): string | null => {
      const element = document.elementFromPoint(clientX, clientY);
      return (
        element
          ?.closest<HTMLElement>("[data-org-unit-drop-target]")
          ?.getAttribute("data-org-unit-drop-target") ?? null
      );
    },
    [],
  );

  const clearPointerDrag = useCallback(() => {
    pointerDragRef.current = null;
    setDraggedId(null);
    setDropTargetId(null);
  }, []);

  const finishPointerDrop = useCallback(
    (draggedId: string, targetId: string | null) => {
      const intent = ciResolveOrgUnitDropDestination(rows, draggedId, targetId);
      clearPointerDrag();
      if (!intent) return;
      const error = validateMove(intent.row, intent.newParent);
      if (error) setFeedback({ ok: false, message: error });
      else setMoveIntent(intent);
    },
    [clearPointerDrag, rows, validateMove],
  );

  const focusItem = useCallback((id: string) => {
    setSelectedId(id);
    requestAnimationFrame(() => itemRefs.current.get(id)?.focus());
  }, []);

  const handleTreeKeyDown = useCallback(
    (event: ReactKeyboardEvent<HTMLDivElement>, entry: TreeEntry) => {
      const index = treeEntries.findIndex(
        ({ row }) => row.orgUnitId === entry.row.orgUnitId,
      );
      const children = childrenByParent.get(entry.row.orgUnitId) ?? [];
      const isExpanded = expanded.has(entry.row.orgUnitId);
      const expandKey = direction === "rtl" ? "ArrowLeft" : "ArrowRight";
      const collapseKey = direction === "rtl" ? "ArrowRight" : "ArrowLeft";
      let nextId: string | undefined;
      if (event.key === "ArrowDown")
        nextId = treeEntries[index + 1]?.row.orgUnitId;
      else if (event.key === "ArrowUp")
        nextId = treeEntries[index - 1]?.row.orgUnitId;
      else if (event.key === "Home") nextId = treeEntries[0]?.row.orgUnitId;
      else if (event.key === "End") nextId = treeEntries.at(-1)?.row.orgUnitId;
      else if (event.key === expandKey) {
        if (children.length && !isExpanded) toggleExpanded(entry.row.orgUnitId);
        else nextId = children[0]?.orgUnitId;
      } else if (event.key === collapseKey) {
        if (children.length && isExpanded) toggleExpanded(entry.row.orgUnitId);
        else nextId = entry.row.parentId ?? undefined;
      } else if (event.key === "Enter" || event.key === " ") {
        setSelectedId(entry.row.orgUnitId);
      } else return;
      event.preventDefault();
      if (nextId) focusItem(nextId);
    },
    [
      childrenByParent,
      direction,
      expanded,
      focusItem,
      toggleExpanded,
      treeEntries,
    ],
  );

  const updateStatus = useCallback(
    async (row: CiOrgUnitManagementRow, status: CiOrgUnitStatus) => {
      setPendingActionId(row.orgUnitId);
      try {
        const result = await onUpdate?.({
          orgUnitId: row.orgUnitId,
          name: row.name,
          description: row.description,
          status,
          tenantIds: row.tenantIds,
          expectedVersion: row.version,
        });
        if (!result) throw new Error("Org Unit management is not configured.");
        if (!result.ok || !result.resource) throw new Error(result.message);
        const saved = result.resource;
        setRows((current) =>
          current.map((candidate) =>
            candidate.orgUnitId === saved.orgUnitId ? saved : candidate,
          ),
        );
        setFeedback({ ok: true, message: result.message });
      } catch (error) {
        setFeedback({
          ok: false,
          message: ciNormalizeClientThrownError(error).message,
        });
      } finally {
        setPendingActionId(null);
        setLifecycleIntent(null);
      }
    },
    [onUpdate],
  );

  const moveOrgUnit = useCallback(
    async (intent: MoveIntent) => {
      setPendingActionId(intent.row.orgUnitId);
      try {
        const result = await onUpdate?.({
          orgUnitId: intent.row.orgUnitId,
          parentId: intent.newParent?.orgUnitId ?? null,
          name: intent.row.name,
          description: intent.row.description,
          status: intent.row.status,
          tenantIds: intent.row.tenantIds,
          expectedVersion: intent.row.version,
        });
        if (!result) throw new Error("Org Unit management is not configured.");
        if (!result.ok || !result.resource) throw new Error(result.message);
        const saved = result.resource;
        const requestedParentId = intent.newParent?.orgUnitId ?? null;
        if (saved.parentId !== requestedParentId) {
          throw new Error(
            "The Org Unit update completed without persisting the requested parent. Deploy the current backend and try the move again.",
          );
        }
        setRows((current) =>
          ciApplyOrgUnitMutation(current, intent.row, saved),
        );
        setExpanded((current) =>
          new Set(current).add(saved.parentId ?? saved.orgUnitId),
        );
        setSelectedId(saved.orgUnitId);
        setFeedback({ ok: true, message: result.message });
      } catch (error) {
        setFeedback({
          ok: false,
          message: ciNormalizeClientThrownError(error).message,
        });
      } finally {
        setPendingActionId(null);
        setMoveIntent(null);
      }
    },
    [onUpdate],
  );

  const allowedTenantIds = draft?.parent
    ? new Set(draft.parent.tenantIds)
    : new Set(tenants.map((tenant) => tenant.tenantId));
  const draftHasInvalidTenant =
    draft?.tenantIds.some((tenantId) => !allowedTenantIds.has(tenantId)) ??
    false;
  const availableTenantOptions = draft
    ? ciGetAvailableOrgUnitTenantOptions(
        tenants,
        draft.parent?.tenantIds ?? null,
        draft.tenantIds,
      )
    : [];
  const draftTargetId = draft?.target?.orgUnitId;
  const parentOptions = draftTargetId
    ? rows
        .filter(
          (candidate) =>
            candidate.orgUnitId !== draftTargetId &&
            !candidate.ancestorOrgUnitIds.includes(draftTargetId),
        )
        .sort((left, right) => left.name.localeCompare(right.name))
    : [];

  const save = async () => {
    if (!draft) return;
    setPending(true);
    try {
      const result =
        draft.mode === "create"
          ? await onCreate?.({
              orgUnitId: draft.orgUnitId,
              parentId: draft.parent?.orgUnitId ?? null,
              name: draft.name,
              slug: draft.slug,
              description: draft.description || undefined,
              status: draft.status,
              tenantIds: draft.tenantIds,
            } satisfies CiCreateOrgUnitInput)
          : await onUpdate?.({
              orgUnitId: draft.orgUnitId,
              parentId: draft.parent?.orgUnitId ?? null,
              name: draft.name,
              description: draft.description || undefined,
              status: draft.status,
              tenantIds: draft.tenantIds,
              expectedVersion: draft.target?.version ?? 0,
            } satisfies CiUpdateOrgUnitInput);
      if (!result) throw new Error("Org Unit management is not configured.");
      if (!result.ok || !result.resource) throw new Error(result.message);
      const saved = result.resource;
      setRows((current) =>
        draft.mode === "edit" && draft.target
          ? ciApplyOrgUnitMutation(current, draft.target, saved)
          : [...current, saved],
      );
      setExpanded((current) =>
        new Set(current).add(saved.parentId ?? saved.orgUnitId),
      );
      setSelectedId(saved.orgUnitId);
      setFeedback({ ok: true, message: result.message });
      setDraft(null);
    } catch (error) {
      setFeedback({
        ok: false,
        message: ciNormalizeClientThrownError(error).message,
      });
    } finally {
      setPending(false);
    }
  };

  const runSeeder = async (operation: "seed" | "cleanup") => {
    if (!developmentSeeder) return;
    setSeederPending(operation);
    try {
      const result =
        operation === "seed"
          ? await developmentSeeder.onSeed()
          : await developmentSeeder.onCleanup();
      if (!result.ok) {
        throw new Error(
          result.items.find((item) => item.status === "failed")?.message ??
            `The ${operation} operation failed.`,
        );
      }
      if (operation === "seed") {
        setRows((current) => {
          const byId = new Map(current.map((row) => [row.orgUnitId, row]));
          (result.orgUnits ?? []).forEach((row) =>
            byId.set(row.orgUnitId, row),
          );
          return [...byId.values()];
        });
        setExpanded((current) => {
          const next = new Set(current);
          (result.orgUnits ?? []).forEach((row) => next.add(row.orgUnitId));
          return next;
        });
      } else {
        const deleted = new Set(
          result.items
            .filter((item) => item.status === "deleted")
            .map((item) => item.id),
        );
        setRows((current) =>
          current.filter((row) => !deleted.has(row.orgUnitId)),
        );
      }
      setSeederFeedback({
        ok: true,
        message:
          operation === "seed"
            ? `${result.created} seeded resource(s) created and ${result.skipped} already present.`
            : `${result.deleted} seeded resource(s) removed and ${result.skipped} preserved.`,
      });
    } catch (error) {
      setSeederFeedback({
        ok: false,
        message: ciNormalizeClientThrownError(error).message,
      });
    } finally {
      setSeederPending(null);
    }
  };

  const actionProps = (row: CiOrgUnitManagementRow) => ({
    row,
    onCreateChild: () => openCreate(row),
    onEdit: () => openEdit(row),
    onActivate: () => void updateStatus(row, "active"),
    onSuspend: () => setLifecycleIntent({ row, status: "suspended" }),
    onArchive: () => setLifecycleIntent({ row, status: "archived" }),
  });

  const lineageArrow: ReactNode =
    direction === "rtl" ? (
      <ChevronLeft className="size-4 text-muted-foreground" aria-hidden />
    ) : (
      <ChevronRight className="size-4 text-muted-foreground" aria-hidden />
    );

  return (
    <section dir={direction} className="w-full space-y-4">
      {feedback ? (
        <CiAlert
          variant={feedback.ok ? "success" : "error"}
          title={feedback.ok ? "Org Unit updated" : "Action failed"}
          onDismiss={() => setFeedback(null)}
        >
          {feedback.message}
        </CiAlert>
      ) : null}

      <div className="mb-8 flex w-full flex-col gap-5 rounded-2xl border border-primary/20 bg-primary/5 p-5 shadow-sm dark:bg-primary/10 sm:p-6 lg:flex-row lg:items-stretch lg:justify-between">
        <div className="flex min-w-0 flex-1 items-stretch gap-4 sm:gap-5">
          <div
            aria-hidden="true"
            className="flex min-h-24 w-24 shrink-0 items-center justify-center self-stretch rounded-2xl border border-primary/30 bg-primary/10 p-4 text-primary [&>svg]:size-16 [&>svg]:shrink-0 sm:w-28"
          >
            <Building2 />
          </div>
          <div className="min-w-0 self-center py-1">
            <div className="mb-2 text-xs font-semibold tracking-[0.14em] text-primary uppercase">
              Org Unit management
            </div>
            <h1 className="text-2xl leading-tight font-semibold tracking-tight sm:text-3xl">
              Org Units
            </h1>
            <p className="mt-2 max-w-3xl text-sm leading-6 text-muted-foreground sm:text-base">
              Browse tenant-aware trees, shared departments, operational status,
              and predecessor relationships across the platform.
            </p>
          </div>
        </div>
        <div className="flex flex-wrap content-end items-end gap-2 lg:max-w-sm lg:justify-end lg:self-end">
          <Badge variant="secondary" className="gap-1.5">
            <Building2 aria-hidden className="size-3.5" />
            {rows.length} {rows.length === 1 ? "Org Unit" : "Org Units"}
          </Badge>
          <Badge variant="secondary" className="gap-1.5">
            <Share2 aria-hidden className="size-3.5" />
            {rows.filter((row) => row.tenantIds.length > 1).length} shared
          </Badge>
          {developmentSeeder ? (
            <Badge variant="secondary" className="gap-1.5">
              <DatabaseZap aria-hidden className="size-3.5" />
              Development seeder
            </Badge>
          ) : null}
        </div>
      </div>

      <Dialog
        open={draft !== null}
        onOpenChange={(open) => {
          if (!open && !pending) setDraft(null);
        }}
      >
        <DialogContent
          className="sm:max-w-2xl"
          showCloseButton={!pending}
          onEscapeKeyDown={(event) => pending && event.preventDefault()}
          onPointerDownOutside={(event) => pending && event.preventDefault()}
        >
          <DialogHeader>
            <DialogTitle>
              {draft?.mode === "edit" ? "Edit Org Unit" : "Create Org Unit"}
            </DialogTitle>
            <DialogDescription>
              {draft?.parent
                ? `This node inherits its allowed tenants from ${draft.parent.name}.`
                : "Root nodes can be shared by any active tenant."}
            </DialogDescription>
          </DialogHeader>
          {draft ? (
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="grid gap-2">
                <Label htmlFor="org-unit-id">Stable ID</Label>
                <Input
                  id="org-unit-id"
                  value={draft.orgUnitId}
                  disabled={draft.mode === "edit" || pending}
                  onChange={(event) =>
                    setDraft({ ...draft, orgUnitId: event.target.value })
                  }
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="org-unit-slug">Slug</Label>
                <Input
                  id="org-unit-slug"
                  value={draft.slug}
                  disabled={draft.mode === "edit" || pending}
                  onChange={(event) =>
                    setDraft({ ...draft, slug: event.target.value })
                  }
                />
              </div>
              {draft.mode === "edit" ? (
                <div className="grid gap-2 sm:col-span-2">
                  <Label htmlFor="org-unit-parent">Parent Org Unit</Label>
                  <Select
                    value={draft.parent?.orgUnitId ?? ALL}
                    disabled={pending}
                    onValueChange={(value) => {
                      const parent =
                        value === ALL ? null : (rowById.get(value) ?? null);
                      setDraft({ ...draft, parent });
                    }}
                  >
                    <SelectTrigger
                      id="org-unit-parent"
                      className="min-h-11 w-full"
                    >
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value={ALL}>Tree root</SelectItem>
                      {parentOptions.map((candidate) => (
                        <SelectItem
                          key={candidate.orgUnitId}
                          value={candidate.orgUnitId}
                        >
                          {candidate.name} — {candidate.path}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <p className="text-xs text-muted-foreground">
                    Moving rewrites this Org Unit and every descendant path and
                    predecessor chain atomically.
                  </p>
                  {draftHasInvalidTenant ? (
                    <p className="text-xs font-medium text-danger-surface-foreground">
                      Remove tenant attachments that are unavailable on the new
                      parent before saving.
                    </p>
                  ) : null}
                </div>
              ) : null}
              <div className="grid gap-2 sm:col-span-2">
                <Label htmlFor="org-unit-name">Name</Label>
                <Input
                  id="org-unit-name"
                  value={draft.name}
                  disabled={pending}
                  onChange={(event) =>
                    setDraft({ ...draft, name: event.target.value })
                  }
                />
              </div>
              <div className="grid gap-2 sm:col-span-2">
                <Label htmlFor="org-unit-description">Description</Label>
                <Textarea
                  id="org-unit-description"
                  value={draft.description}
                  disabled={pending}
                  onChange={(event) =>
                    setDraft({ ...draft, description: event.target.value })
                  }
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="org-unit-status">Status</Label>
                <Select
                  value={draft.status}
                  onValueChange={(value) =>
                    setDraft({ ...draft, status: value as CiOrgUnitStatus })
                  }
                  disabled={pending}
                >
                  <SelectTrigger
                    id="org-unit-status"
                    className="min-h-11 w-full"
                  >
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="active">Active</SelectItem>
                    <SelectItem value="suspended">Suspended</SelectItem>
                    <SelectItem value="archived">Archived</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="grid gap-2 sm:col-span-2">
                <Label htmlFor="org-unit-tenants">Tenant attachments</Label>
                <CiSearchableChipMultiSelect
                  id="org-unit-tenants"
                  label="Tenant attachments"
                  placeholder="Add tenant…"
                  showAllOptions
                  disabled={pending}
                  options={availableTenantOptions}
                  selectedItems={draft.tenantIds.map((tenantId) => ({
                    id: tenantId,
                    label: tenantNames.get(tenantId) ?? tenantId,
                  }))}
                  emptyMessage={
                    draft.parent
                      ? `No more tenants attached to ${draft.parent.name} are available.`
                      : "All available tenants are already attached."
                  }
                  onAdd={(option) => {
                    if (draft.tenantIds.includes(option.id)) return;
                    setDraft({
                      ...draft,
                      tenantIds: [...draft.tenantIds, option.id],
                    });
                  }}
                  onRemove={(tenantId) =>
                    setDraft({
                      ...draft,
                      tenantIds: draft.tenantIds.filter(
                        (id) => id !== tenantId,
                      ),
                    })
                  }
                />
                <p className="text-xs leading-5 text-muted-foreground">
                  {draft.parent
                    ? `Only tenants already attached to ${draft.parent.name} are available. Remove a chip to detach a tenant.`
                    : "Root Org Units can attach any available tenant. Remove a chip to detach a tenant."}
                </p>
              </div>
            </div>
          ) : null}
          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              disabled={pending}
              onClick={() => setDraft(null)}
            >
              Cancel
            </Button>
            <Button
              type="button"
              disabled={
                pending ||
                !draft?.orgUnitId.trim() ||
                !draft.name.trim() ||
                !draft.slug.trim() ||
                draft.tenantIds.length === 0 ||
                draftHasInvalidTenant
              }
              aria-busy={pending}
              onClick={() => void save()}
            >
              {pending ? (
                <LoaderCircle className="animate-spin" aria-hidden />
              ) : null}
              {pending ? "Saving…" : "Save Org Unit"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <CiAlertDialog
        open={lifecycleIntent !== null}
        onOpenChange={(open) => {
          if (!open && pendingActionId === null) setLifecycleIntent(null);
        }}
        variant={
          lifecycleIntent?.status === "archived" ? "destructive" : "warning"
        }
        icon={
          lifecycleIntent?.status === "archived" ? (
            <Archive aria-hidden />
          ) : (
            <CirclePause aria-hidden />
          )
        }
        title={`${lifecycleIntent?.status === "archived" ? "Archive" : "Suspend"} “${lifecycleIntent?.row.name ?? "Org Unit"}”?`}
        description={
          lifecycleIntent?.status === "archived"
            ? "The Org Unit remains retained for audit and can no longer be used as an active operational node. Descendant access is still evaluated through the recorded predecessor path."
            : "The Org Unit remains in the tree but is unavailable for active operations until it is reactivated."
        }
        confirmLabel={
          lifecycleIntent?.status === "archived"
            ? "Archive Org Unit"
            : "Suspend Org Unit"
        }
        pendingLabel="Updating…"
        pending={pendingActionId !== null}
        onConfirm={() =>
          lifecycleIntent
            ? updateStatus(lifecycleIntent.row, lifecycleIntent.status)
            : undefined
        }
      />

      <CiAlertDialog
        open={moveIntent !== null}
        onOpenChange={(open) => {
          if (!open && pendingActionId === null) setMoveIntent(null);
        }}
        variant="warning"
        icon={<GitFork aria-hidden />}
        title={`Move “${moveIntent?.row.name ?? "Org Unit"}”?`}
        description={
          moveIntent?.newParent
            ? `This Org Unit and its complete subtree will move under “${moveIntent.newParent.name}”. Every descendant route and predecessor chain will be rewritten atomically.`
            : "This Org Unit and its complete subtree will become a root tree. Every descendant route and predecessor chain will be rewritten atomically."
        }
        confirmLabel="Move Org Unit"
        pendingLabel="Moving…"
        pending={pendingActionId !== null}
        onConfirm={() => (moveIntent ? moveOrgUnit(moveIntent) : undefined)}
      />

      {developmentSeeder ? (
        <>
          <Dialog
            open={seederOpen}
            onOpenChange={(open) => {
              if (seederPending === null) setSeederOpen(open);
            }}
          >
            <DialogContent
              className="sm:max-w-lg"
              showCloseButton={seederPending === null}
              onEscapeKeyDown={(event) => {
                if (seederPending !== null) event.preventDefault();
              }}
              onPointerDownOutside={(event) => {
                if (seederPending !== null) event.preventDefault();
              }}
            >
              <DialogHeader>
                <DialogTitle>{developmentSeeder.title}</DialogTitle>
                <DialogDescription>
                  {developmentSeeder.description ??
                    "Create and clean up development-only test data."}
                </DialogDescription>
              </DialogHeader>
              {seederFeedback ? (
                <CiAlert
                  variant={seederFeedback.ok ? "success" : "error"}
                  title={seederFeedback.ok ? "Seeder updated" : "Seeder failed"}
                  onDismiss={() => setSeederFeedback(null)}
                >
                  {seederFeedback.message}
                </CiAlert>
              ) : null}
              <DialogFooter>
                <Button
                  type="button"
                  className="min-h-11"
                  disabled={seederPending !== null}
                  aria-busy={seederPending === "seed"}
                  onClick={() => void runSeeder("seed")}
                >
                  {seederPending === "seed" ? (
                    <LoaderCircle className="animate-spin" aria-hidden />
                  ) : (
                    <DatabaseZap aria-hidden />
                  )}
                  {seederPending === "seed"
                    ? "Seeding…"
                    : "Seed Tenants & Org Units"}
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  className="min-h-11"
                  disabled={seederPending !== null}
                  onClick={() => {
                    setSeederOpen(false);
                    setCleanupOpen(true);
                  }}
                >
                  <Trash2 aria-hidden />
                  Clean Up
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>

          <CiAlertDialog
            open={cleanupOpen}
            onOpenChange={(open) => {
              setCleanupOpen(open);
              if (!open) setSeederOpen(true);
            }}
            variant="destructive"
            icon={<Trash2 aria-hidden />}
            title={`Clean up “${developmentSeeder.title}”?`}
            description="Only tenant and Org Unit records carrying this seeder's provenance marker are removed. Existing and ownership-mismatched resources are preserved."
            confirmLabel="Clean up seeded resources"
            pendingLabel="Cleaning up…"
            pending={seederPending === "cleanup"}
            onConfirm={() => runSeeder("cleanup")}
          />
        </>
      ) : null}

      <div className="overflow-hidden rounded-2xl border bg-card shadow-sm">
        <div className="flex flex-wrap items-center gap-2 border-b bg-muted/20 p-3 sm:p-4">
          <label className="relative min-w-56 flex-1 sm:max-w-sm">
            <Search
              className="pointer-events-none absolute start-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground"
              aria-hidden
            />
            <span className="sr-only">Search Org Units</span>
            <Input
              value={searchValue}
              onChange={(event) => setSearchValue(event.target.value)}
              placeholder="Search Org Units..."
              className="h-11 bg-background ps-9"
            />
          </label>
          <Select value={tenantFilter} onValueChange={setTenantFilter}>
            <SelectTrigger
              className="h-11 w-full bg-background sm:w-48"
              aria-label="Filter by tenant"
            >
              <SelectValue placeholder="All tenants" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value={ALL}>All tenants</SelectItem>
              {tenantOptions.map((tenant) => (
                <SelectItem key={tenant.id} value={tenant.id}>
                  {tenant.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger
              className="h-11 w-full bg-background sm:w-44"
              aria-label="Filter by status"
            >
              <SelectValue placeholder="All statuses" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value={ALL}>All statuses</SelectItem>
              <SelectItem value="active">Active</SelectItem>
              <SelectItem value="suspended">Suspended</SelectItem>
              <SelectItem value="archived">Archived</SelectItem>
            </SelectContent>
          </Select>
          <Button
            type="button"
            variant="outline"
            className="min-h-11"
            onClick={() =>
              setExpanded(new Set(rows.map((row) => row.orgUnitId)))
            }
          >
            <ChevronsUpDown aria-hidden />
            Expand all
          </Button>
          <Button
            type="button"
            variant="outline"
            className="min-h-11"
            onClick={() => setExpanded(new Set())}
          >
            <ChevronsDownUp aria-hidden />
            Collapse all
          </Button>
          {canManage ? (
            <Button
              type="button"
              className="min-h-11"
              onClick={() => openCreate(null)}
            >
              <Plus aria-hidden />
              New root
            </Button>
          ) : null}
          {developmentSeeder ? (
            <Button
              type="button"
              variant="outline"
              className="min-h-11"
              onClick={() => {
                setSeederFeedback(null);
                setSeederOpen(true);
              }}
            >
              <DatabaseZap aria-hidden />
              Seeder
            </Button>
          ) : null}
        </div>

        <div
          className="flex min-h-[34rem] flex-col lg:flex-row"
          aria-label="Org Unit explorer"
        >
          <aside
            className="flex min-h-80 w-full shrink-0 flex-col border-b bg-muted/10 lg:min-h-[34rem] lg:border-b-0 lg:border-e lg:[inline-size:var(--org-unit-tree-width)]"
            style={
              {
                "--org-unit-tree-width": `${treeWidth}px`,
              } as CSSProperties
            }
            aria-label="Org Unit tree panel"
          >
            <div className="flex min-h-14 items-center justify-between gap-3 border-b px-4">
              <div>
                <h2 className="text-sm font-semibold">Org Unit trees</h2>
                <p className="text-xs text-muted-foreground">
                  {treeEntries.length} visible of {rows.length}
                </p>
                {canManage ? (
                  <p className="text-xs text-muted-foreground">
                    Drag a move handle onto a node, or use Edit for keyboard
                    access.
                  </p>
                ) : null}
              </div>
              <Badge variant="secondary">
                {childrenByParent.get(null)?.length ?? 0} roots
              </Badge>
            </div>
            {canManage ? (
              <div
                data-org-unit-drop-target={ROOT_DROP_TARGET}
                aria-label="Org Unit tree root drop target"
                className={cn(
                  "mx-2 mt-2 flex min-h-11 items-center justify-center rounded-lg border border-dashed px-3 text-xs font-medium transition-colors",
                  dropTargetId === ROOT_DROP_TARGET && activeDraggedRow
                    ? validateMove(activeDraggedRow, null)
                      ? "border-danger-border bg-danger-surface text-danger-surface-foreground"
                      : "border-primary bg-primary/10 text-primary"
                    : "border-border text-muted-foreground",
                )}
              >
                {draggedId
                  ? "Drop here to move to the tree root"
                  : "Drag a move handle here to create a tree root"}
              </div>
            ) : null}
            <div
              role="tree"
              aria-label="Org Unit hierarchy"
              className="min-h-0 flex-1 overflow-auto p-2"
            >
              {treeEntries.length ? (
                treeEntries.map((entry) => {
                  const row = entry.row;
                  const childCount =
                    childrenByParent.get(row.orgUnitId)?.length ?? 0;
                  const hasChildren = childCount > 0;
                  const isExpanded = expanded.has(row.orgUnitId);
                  const isSelected = selectedId === row.orgUnitId;
                  const dropError = activeDraggedRow
                    ? validateMove(activeDraggedRow, row)
                    : null;
                  return (
                    <ContextMenuPrimitive.Root
                      key={row.orgUnitId}
                      dir={direction}
                    >
                      <ContextMenuPrimitive.Trigger asChild>
                        <div
                          ref={(element) => {
                            if (element)
                              itemRefs.current.set(row.orgUnitId, element);
                            else itemRefs.current.delete(row.orgUnitId);
                          }}
                          role="treeitem"
                          aria-level={entry.depth + 1}
                          aria-selected={isSelected}
                          aria-expanded={hasChildren ? isExpanded : undefined}
                          aria-description={
                            canManage
                              ? "Use the move handle to drag onto another Org Unit, or use Edit to assign a parent."
                              : undefined
                          }
                          data-org-unit-drop-target={row.orgUnitId}
                          tabIndex={isSelected ? 0 : -1}
                          className={cn(
                            "group flex min-h-11 cursor-default items-center gap-1 rounded-lg border border-transparent pe-1 text-sm outline-none transition-colors focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-1",
                            isSelected
                              ? "border-primary/25 bg-primary/10 text-foreground"
                              : "hover:bg-accent/70",
                            pendingActionId === row.orgUnitId && "opacity-60",
                            draggedId === row.orgUnitId && "opacity-60",
                            dropTargetId === row.orgUnitId &&
                              (dropError
                                ? "border-danger-border bg-danger-surface"
                                : "border-primary bg-primary/10"),
                          )}
                          style={{
                            paddingInlineStart: `${8 + entry.depth * 20}px`,
                          }}
                          onClick={() => setSelectedId(row.orgUnitId)}
                          onFocus={() => setSelectedId(row.orgUnitId)}
                          onKeyDown={(event) => handleTreeKeyDown(event, entry)}
                        >
                          {canManage ? (
                            <button
                              type="button"
                              className="flex size-11 shrink-0 touch-none cursor-grab items-center justify-center rounded-md text-muted-foreground hover:bg-accent hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring active:cursor-grabbing data-[dragging=true]:bg-primary/10 data-[dragging=true]:text-primary"
                              aria-label={`Move ${row.name}`}
                              aria-description="Drag onto another Org Unit to move it. Press Enter to choose a parent in Edit."
                              data-dragging={draggedId === row.orgUnitId}
                              disabled={pendingActionId !== null}
                              title="Drag to move this Org Unit"
                              onClick={(event) => {
                                event.stopPropagation();
                                if (suppressMoveHandleClickRef.current) {
                                  suppressMoveHandleClickRef.current = false;
                                  return;
                                }
                                openEdit(row);
                              }}
                              onPointerDown={(event) => {
                                if (
                                  !event.isPrimary ||
                                  event.button !== 0 ||
                                  pendingActionId !== null
                                )
                                  return;
                                event.preventDefault();
                                event.stopPropagation();
                                suppressMoveHandleClickRef.current = false;
                                pointerDragRef.current = {
                                  pointerId: event.pointerId,
                                  rowId: row.orgUnitId,
                                  startX: event.clientX,
                                  startY: event.clientY,
                                  active: false,
                                };
                                event.currentTarget.setPointerCapture(
                                  event.pointerId,
                                );
                                setSelectedId(row.orgUnitId);
                              }}
                              onPointerMove={(event) => {
                                const session = pointerDragRef.current;
                                if (
                                  !session ||
                                  session.pointerId !== event.pointerId
                                )
                                  return;
                                if (!session.active) {
                                  const distance = Math.hypot(
                                    event.clientX - session.startX,
                                    event.clientY - session.startY,
                                  );
                                  if (
                                    distance < POINTER_DRAG_ACTIVATION_DISTANCE
                                  )
                                    return;
                                  session.active = true;
                                  setDraggedId(session.rowId);
                                }
                                event.preventDefault();
                                setDropTargetId(
                                  resolvePointerDropTarget(
                                    event.clientX,
                                    event.clientY,
                                  ),
                                );
                              }}
                              onPointerUp={(event) => {
                                const session = pointerDragRef.current;
                                if (
                                  !session ||
                                  session.pointerId !== event.pointerId
                                )
                                  return;
                                if (
                                  event.currentTarget.hasPointerCapture(
                                    event.pointerId,
                                  )
                                )
                                  event.currentTarget.releasePointerCapture(
                                    event.pointerId,
                                  );
                                if (!session.active) {
                                  pointerDragRef.current = null;
                                  return;
                                }
                                event.preventDefault();
                                event.stopPropagation();
                                suppressMoveHandleClickRef.current = true;
                                finishPointerDrop(
                                  session.rowId,
                                  resolvePointerDropTarget(
                                    event.clientX,
                                    event.clientY,
                                  ),
                                );
                              }}
                              onPointerCancel={() => clearPointerDrag()}
                            >
                              <GripVertical className="size-4" aria-hidden />
                            </button>
                          ) : null}
                          {hasChildren ? (
                            <button
                              type="button"
                              className="flex size-9 shrink-0 items-center justify-center rounded-md text-muted-foreground hover:bg-accent hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                              aria-label={`${isExpanded ? "Collapse" : "Expand"} ${row.name}`}
                              onClick={(event) => {
                                event.stopPropagation();
                                toggleExpanded(row.orgUnitId);
                              }}
                            >
                              {isExpanded ? (
                                <ChevronDown className="size-4" aria-hidden />
                              ) : direction === "rtl" ? (
                                <ChevronLeft className="size-4" aria-hidden />
                              ) : (
                                <ChevronRight className="size-4" aria-hidden />
                              )}
                            </button>
                          ) : (
                            <span className="size-9 shrink-0" aria-hidden />
                          )}
                          <span
                            className={cn(
                              "flex size-7 shrink-0 items-center justify-center rounded-md",
                              hasChildren
                                ? "bg-primary/10 text-primary"
                                : "text-muted-foreground",
                            )}
                            title={
                              hasChildren ? "Parent Org Unit" : "Leaf Org Unit"
                            }
                            aria-hidden
                          >
                            <GitFork
                              className={cn(
                                "size-4",
                                !hasChildren && "scale-90 opacity-70",
                              )}
                            />
                          </span>
                          <span
                            className="min-w-0 flex-1 truncate font-medium"
                            title={row.name}
                          >
                            {row.name}
                          </span>
                          <CiNewResourceBadge createdAt={row.createdAt} />
                          {row.tenantIds.length > 1 ? (
                            <Share2
                              className="size-3.5 shrink-0 text-muted-foreground"
                              aria-label="Shared by multiple tenants"
                            />
                          ) : null}
                          <span
                            className={cn(
                              "size-2.5 shrink-0 rounded-full ring-2 ring-background",
                              statusDotClassName(row.status),
                            )}
                            data-status={row.status}
                            title={statusLabel(row.status)}
                            aria-hidden
                          />
                          {canManage ? (
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <Button
                                  type="button"
                                  variant="ghost"
                                  className="size-9 shrink-0 p-0 opacity-100 lg:opacity-0 lg:group-hover:opacity-100 lg:group-focus-within:opacity-100 data-[state=open]:opacity-100"
                                  aria-label={`Actions for ${row.name}`}
                                  onClick={(event) => event.stopPropagation()}
                                >
                                  <CircleEllipsis
                                    className="size-4"
                                    aria-hidden
                                  />
                                </Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="end" className="w-56">
                                <DropdownActions {...actionProps(row)} />
                              </DropdownMenuContent>
                            </DropdownMenu>
                          ) : null}
                        </div>
                      </ContextMenuPrimitive.Trigger>
                      {canManage ? (
                        <ContextMenuPrimitive.Portal>
                          <ContextMenuPrimitive.Content className="z-50 min-w-56 overflow-hidden rounded-md border bg-popover p-1 text-popover-foreground shadow-md">
                            <ContextActions {...actionProps(row)} />
                          </ContextMenuPrimitive.Content>
                        </ContextMenuPrimitive.Portal>
                      ) : null}
                    </ContextMenuPrimitive.Root>
                  );
                })
              ) : (
                <div className="flex min-h-56 flex-col items-center justify-center gap-2 px-6 text-center">
                  <Search
                    className="size-8 text-muted-foreground"
                    aria-hidden
                  />
                  <p className="font-medium">No matching Org Units</p>
                  <p className="text-sm text-muted-foreground">
                    Adjust the search or filters to restore the tree.
                  </p>
                </div>
              )}
            </div>
          </aside>

          <div
            role="separator"
            aria-label="Resize Org Unit tree panel"
            aria-orientation="vertical"
            aria-valuemin={MIN_TREE_WIDTH}
            aria-valuemax={MAX_TREE_WIDTH}
            aria-valuenow={treeWidth}
            tabIndex={0}
            className={cn(
              "group relative hidden w-3 shrink-0 cursor-col-resize touch-none items-center justify-center bg-border/25 outline-none hover:bg-primary/10 focus-visible:bg-primary/10 focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-ring lg:flex",
              resizing && "bg-primary/10",
            )}
            onPointerDown={(event: ReactPointerEvent<HTMLDivElement>) => {
              resizeStart.current = {
                clientX: event.clientX,
                width: treeWidth,
              };
              setResizing(true);
            }}
            onKeyDown={(event) => {
              if (event.key !== "ArrowLeft" && event.key !== "ArrowRight")
                return;
              event.preventDefault();
              const visualDelta = event.key === "ArrowRight" ? 16 : -16;
              const next = clampWidth(
                treeWidth + (direction === "rtl" ? -visualDelta : visualDelta),
              );
              currentTreeWidth.current = next;
              setTreeWidth(next);
              window.localStorage.setItem(TREE_WIDTH_KEY, String(next));
            }}
          >
            <span
              className="h-12 w-1 rounded-full bg-border transition-colors group-hover:bg-primary/60 group-focus-visible:bg-primary"
              aria-hidden
            />
          </div>

          <main
            className="min-w-0 flex-1 bg-background"
            aria-label="Focused Org Unit information"
          >
            {selected ? (
              <div className="space-y-6 p-4 sm:p-6">
                <div className="flex flex-col gap-4 border-b pb-5 sm:flex-row sm:items-start sm:justify-between">
                  <div className="flex min-w-0 items-start gap-3">
                    <div className="flex size-12 shrink-0 items-center justify-center rounded-xl border border-primary/25 bg-primary/10 text-primary">
                      <Building2 className="size-6" aria-hidden />
                    </div>
                    <div className="min-w-0">
                      <div className="mb-1 flex flex-wrap items-center gap-2">
                        <h2 className="text-xl font-semibold tracking-tight sm:text-2xl">
                          {selected.name}
                        </h2>
                        <Badge
                          variant="outline"
                          className={statusClassName(selected.status)}
                        >
                          {statusLabel(selected.status)}
                        </Badge>
                        {selected.tenantIds.length > 1 ? (
                          <Badge variant="secondary">
                            <Share2 aria-hidden />
                            Shared
                          </Badge>
                        ) : null}
                      </div>
                      <p className="break-all text-sm text-muted-foreground">
                        {selected.path}
                      </p>
                    </div>
                  </div>
                  {canManage ? (
                    <div className="flex flex-wrap gap-2">
                      <Button
                        type="button"
                        variant="outline"
                        className="min-h-11"
                        onClick={() => openEdit(selected)}
                      >
                        <Pencil aria-hidden />
                        Edit
                      </Button>
                      <Button
                        type="button"
                        className="min-h-11"
                        onClick={() => openCreate(selected)}
                      >
                        <Plus aria-hidden />
                        Add child
                      </Button>
                    </div>
                  ) : null}
                </div>

                <section aria-labelledby="org-unit-overview-heading">
                  <h3
                    id="org-unit-overview-heading"
                    className="mb-3 text-sm font-semibold"
                  >
                    Overview
                  </h3>
                  <dl className="grid overflow-hidden rounded-xl border sm:grid-cols-2 xl:grid-cols-3">
                    {[
                      ["Stable ID", selected.orgUnitId],
                      ["Slug", selected.slug],
                      ["Parent", selectedParent?.name ?? "Root Org Unit"],
                      [
                        "Tree depth",
                        String(selected.ancestorOrgUnitIds.length),
                      ],
                      [
                        "Direct children",
                        String(
                          childrenByParent.get(selected.orgUnitId)?.length ?? 0,
                        ),
                      ],
                      ["Version", String(selected.version)],
                    ].map(([label, value]) => (
                      <div
                        key={label}
                        className="min-w-0 border-b p-4 last:border-b-0 sm:border-e xl:[&:nth-child(3n)]:border-e-0"
                      >
                        <dt className="text-xs font-medium tracking-wide text-muted-foreground uppercase">
                          {label}
                        </dt>
                        <dd className="mt-1 break-words text-sm font-medium">
                          {value}
                        </dd>
                      </div>
                    ))}
                  </dl>
                </section>

                <div className="grid gap-6 xl:grid-cols-2">
                  <section
                    aria-labelledby="org-unit-lineage-heading"
                    className="rounded-xl border p-4"
                  >
                    <h3
                      id="org-unit-lineage-heading"
                      className="text-sm font-semibold"
                    >
                      Predecessor path
                    </h3>
                    <p className="mt-1 text-xs text-muted-foreground">
                      Access inherited from a predecessor can apply to this
                      node.
                    </p>
                    <div className="mt-4 flex flex-wrap items-center gap-2">
                      {selectedAncestors.length ? (
                        selectedAncestors.map((ancestor, index) => (
                          <div key={ancestor.orgUnitId} className="contents">
                            {index > 0 ? lineageArrow : null}
                            <button
                              type="button"
                              className="rounded-md border bg-muted/40 px-3 py-2 text-sm font-medium hover:bg-accent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                              onClick={() => focusItem(ancestor.orgUnitId)}
                            >
                              {ancestor.name}
                            </button>
                          </div>
                        ))
                      ) : (
                        <span className="text-sm text-muted-foreground">
                          This is a root Org Unit.
                        </span>
                      )}
                      {selectedAncestors.length ? lineageArrow : null}
                      <Badge>{selected.name}</Badge>
                    </div>
                  </section>

                  <section
                    aria-labelledby="org-unit-tenants-heading"
                    className="rounded-xl border p-4"
                  >
                    <h3
                      id="org-unit-tenants-heading"
                      className="text-sm font-semibold"
                    >
                      Tenant attachments
                    </h3>
                    <p className="mt-1 text-xs text-muted-foreground">
                      A shared Org Unit appears in each attached tenant
                      hierarchy.
                    </p>
                    <div className="mt-4 flex flex-wrap gap-2">
                      {[...selected.tenantIds]
                        .sort((left, right) =>
                          (tenantNames.get(left) ?? left).localeCompare(
                            tenantNames.get(right) ?? right,
                          ),
                        )
                        .map((tenantId) => (
                          <Badge key={tenantId} variant="outline">
                            <Building2 aria-hidden />
                            {tenantNames.get(tenantId) ?? tenantId}
                          </Badge>
                        ))}
                    </div>
                  </section>
                </div>

                <section
                  aria-labelledby="org-unit-description-heading"
                  className="rounded-xl border p-4"
                >
                  <h3
                    id="org-unit-description-heading"
                    className="text-sm font-semibold"
                  >
                    Description
                  </h3>
                  <p className="mt-2 whitespace-pre-wrap text-sm leading-6 text-muted-foreground">
                    {selected.description?.trim() ||
                      "No description has been provided for this Org Unit."}
                  </p>
                </section>

                <dl className="flex flex-wrap gap-x-8 gap-y-3 border-t pt-4 text-xs text-muted-foreground">
                  <div>
                    <dt className="inline font-medium text-foreground">
                      Created:{" "}
                    </dt>
                    <dd className="inline">
                      {ciFormatDateTime(selected.createdAt, locale)}
                    </dd>
                  </div>
                  <div>
                    <dt className="inline font-medium text-foreground">
                      Updated:{" "}
                    </dt>
                    <dd className="inline">
                      {ciFormatDateTime(selected.updatedAt, locale)}
                    </dd>
                  </div>
                </dl>
              </div>
            ) : (
              <div className="flex min-h-[34rem] flex-col items-center justify-center gap-3 p-8 text-center">
                <Building2
                  className="size-10 text-muted-foreground"
                  aria-hidden
                />
                <h2 className="text-lg font-semibold">Select an Org Unit</h2>
                <p className="max-w-sm text-sm text-muted-foreground">
                  Choose a node in the tree to inspect its information, sharing,
                  lineage, and lifecycle.
                </p>
              </div>
            )}
          </main>
        </div>
      </div>
    </section>
  );
}
