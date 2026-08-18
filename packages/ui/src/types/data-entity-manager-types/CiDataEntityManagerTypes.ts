import type { ReactNode } from "react";
import type { RowData } from "@tanstack/react-table";

import type {
  CiDataTableDataSource,
  CiDataTableInterface,
} from "../data-table-types";

/** Provider-neutral scalar categories supported by the generated editor. */
export type CiDataEntityFieldType = "string" | "number" | "boolean" | "json";

/** Browser input presentation available to string-valued entity fields. */
export type CiDataEntityStringInput =
  "text" | "textarea" | "email" | "url" | "date" | "time" | "datetime-local";

/** Shared metadata for one field rendered by the entity editor. */
export type CiDataEntityFieldBase<TRecord extends RowData> = {
  /** Stable record property name. */
  name: Extract<keyof TRecord, string>;
  /** Human-readable form label. */
  label: string;
  /** Whether an empty value is rejected. */
  required?: boolean;
  /** Whether the field stores an array of the declared scalar type. */
  array?: boolean;
  /** Whether null array items are rejected. */
  itemsRequired?: boolean;
  /** Persistent guidance rendered below the control. */
  description?: string;
  /** Optional control placeholder. */
  placeholder?: string;
  /** Value used when a create dialog is opened. */
  defaultValue?: unknown | (() => unknown);
  /** Prevents edits while retaining the value in the submitted draft. */
  readOnly?: boolean;
  /** Prevents edits only for an existing record. */
  readOnlyOnUpdate?: boolean;
  /** Optional provider-neutral field validation. Return a message to reject. */
  validate?: (
    value: unknown,
    values: Partial<TRecord>,
    mode: CiDataEntityEditorMode,
  ) => string | undefined;
};

/** Metadata for a string, date, time, or multiline field. */
export type CiDataEntityStringField<TRecord extends RowData> =
  CiDataEntityFieldBase<TRecord> & {
    valueKind: "string";
    inputKind?: CiDataEntityStringInput;
  };

/** Metadata for a finite numeric field. */
export type CiDataEntityNumberField<TRecord extends RowData> =
  CiDataEntityFieldBase<TRecord> & {
    valueKind: "number";
    min?: number;
    max?: number;
    step?: number | "any";
  };

/** Metadata for a true/false field. */
export type CiDataEntityBooleanField<TRecord extends RowData> =
  CiDataEntityFieldBase<TRecord> & {
    valueKind: "boolean";
  };

/** Metadata for a JSON-compatible value. */
export type CiDataEntityJsonField<TRecord extends RowData> =
  CiDataEntityFieldBase<TRecord> & {
    valueKind: "json";
  };

/** Describes one provider-neutral field in a dynamic entity editor. */
export type CiDataEntityField<TRecord extends RowData> =
  | CiDataEntityStringField<TRecord>
  | CiDataEntityNumberField<TRecord>
  | CiDataEntityBooleanField<TRecord>
  | CiDataEntityJsonField<TRecord>;

/** Identifies whether the editor is creating or updating a record. */
export type CiDataEntityEditorMode = "create" | "edit";

/** Normalized result returned by create, update, and delete callbacks. */
export type CiDataEntityMutationResult<TRecord> =
  | {
      ok: true;
      message?: string;
      record?: TRecord;
    }
  | {
      ok: false;
      message: string;
    };

/** Callback used to create one record from the dynamic editor values. */
export type CiDataEntityCreateCallback<TRecord extends RowData> = (
  values: Partial<TRecord>,
) =>
  | void
  | CiDataEntityMutationResult<TRecord>
  | Promise<void | CiDataEntityMutationResult<TRecord>>;

/** Callback used to update one record from the dynamic editor values. */
export type CiDataEntityUpdateCallback<TRecord extends RowData> = (
  record: TRecord,
  values: Partial<TRecord>,
) =>
  | void
  | CiDataEntityMutationResult<TRecord>
  | Promise<void | CiDataEntityMutationResult<TRecord>>;

/** Callback used to delete one acknowledged record. */
export type CiDataEntityDeleteCallback<TRecord extends RowData> = (
  record: TRecord,
) =>
  | void
  | CiDataEntityMutationResult<TRecord>
  | Promise<void | CiDataEntityMutationResult<TRecord>>;

/** Copy overrides for the reusable entity-management interaction. */
export type CiDataEntityManagerLabels = Partial<{
  createAction: string;
  editAction: string;
  deleteAction: string;
  createTitle: string;
  editTitle: string;
  editorDescription: string;
  cancelAction: string;
  saveCreateAction: string;
  saveEditAction: string;
  savingCreate: string;
  savingEdit: string;
  deleteTitle: string;
  deleteDescription: string;
  deleting: string;
  createSuccess: string;
  updateSuccess: string;
  deleteSuccess: string;
  successTitle: string;
  errorTitle: string;
}>;

/** Complete table props passed to a manager's render boundary. */
export type CiDataEntityManagerTableProps<TRecord extends RowData> =
  CiDataTableInterface<TRecord, unknown>;

/** Optional table presentation and definition overrides owned by the caller. */
export type CiDataEntityManagerTableOverrides<TRecord extends RowData> = Omit<
  CiDataTableInterface<TRecord, unknown>,
  "title" | "description" | "data" | "source" | "columns" | "rowActions"
>;

/** Render boundary used by generated managers to own the table element. */
export type CiDataEntityManagerTableRenderer<TRecord extends RowData> = (
  props: CiDataEntityManagerTableProps<TRecord>,
) => ReactNode;

/** Public configuration for the reusable provider-neutral entity manager. */
export type CiDataEntityManagerProps<TRecord extends RowData> = {
  /** Heading passed to the rendered data table. */
  title: string;
  /** Supporting copy passed to the rendered data table. */
  description?: string;
  /** Singular human-readable label, for example Book. */
  entityLabel: string;
  /** Plural human-readable label, for example Books. */
  entityPluralLabel: string;
  /** Field metadata that drives create and edit dialogs. */
  fields: readonly CiDataEntityField<TRecord>[];
  /** Static rows for client mode. */
  data?: TRecord[];
  /** Provider-backed, paginated rows for server or hybrid mode. */
  source?: CiDataTableDataSource<TRecord>;
  /** Stable identity required by selectable and mutable table records. */
  getRowId: (record: TRecord, index: number) => string;
  /** Optional table presentation, configuration, and definition extensions. */
  tableProps?: CiDataEntityManagerTableOverrides<TRecord>;
  /** Renders the resulting table. Generated code can render CiDataTable directly. */
  renderTable: CiDataEntityManagerTableRenderer<TRecord>;
  /** Creates a record. Omit to remove the built-in create action. */
  onCreate?: CiDataEntityCreateCallback<TRecord>;
  /** Updates a record. Omit to remove the built-in edit action. */
  onUpdate?: CiDataEntityUpdateCallback<TRecord>;
  /** Deletes a record. Omit to remove the built-in delete action. */
  onDelete?: CiDataEntityDeleteCallback<TRecord>;
  /** Initial create values merged over field defaults. */
  createInitialValues?: Partial<TRecord> | (() => Partial<TRecord>);
  /** Enables or disables the create operation when a callback exists. */
  canCreate?: boolean;
  /** Enables or disables update per record when a callback exists. */
  canUpdate?: boolean | ((record: TRecord) => boolean);
  /** Enables or disables deletion per record when a callback exists. */
  canDelete?: boolean | ((record: TRecord) => boolean);
  /** Returns the record name used in edit and delete copy. */
  getRecordLabel?: (record: TRecord) => string;
  /** Customizes the consequence text in the delete acknowledgement. */
  renderDeleteDescription?: (record: TRecord) => ReactNode;
  /** Optional copy overrides. */
  labels?: CiDataEntityManagerLabels;
  /** Optional outer container class. */
  className?: string;
};
