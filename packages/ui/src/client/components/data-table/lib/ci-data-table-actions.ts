/** Common conditional surface shared by row actions and built-in controls. */
export type CiDataTableConditionalControl<TData> = {
  hideWhen?: (row: TData) => boolean;
  disableWhen?: (row: TData) => boolean;
  isVisible?: (row: TData) => boolean;
  isDisabled?: (row: TData) => boolean;
};

/** Returns whether a record-specific action should be rendered. */
export function ciIsDataTableControlVisible<TData>(
  control: CiDataTableConditionalControl<TData>,
  row: TData
): boolean {
  return (
    !(control.hideWhen?.(row) ?? false) && (control.isVisible?.(row) ?? true)
  );
}

/** Returns whether a rendered record-specific action should be disabled. */
export function ciIsDataTableControlDisabled<TData>(
  control: CiDataTableConditionalControl<TData>,
  row: TData
): boolean {
  return (
    (control.disableWhen?.(row) ?? false) ||
    (control.isDisabled?.(row) ?? false)
  );
}
