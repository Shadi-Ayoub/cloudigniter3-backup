"use client";

import {
  Button,
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@ci-ui/client";
import type {
  CiDataTableAction,
  CiDataTableInformation,
  CiDataTableRowActionContext,
} from "@ci-ui/types";

import {
  ciIsDataTableControlDisabled,
  ciIsDataTableControlVisible,
} from "../lib/ci-data-table-actions";
import { CiDataTableInformationControl } from "./CiDataTableInformationControl";
import { CiDataTableRowActionsMenu } from "./CiDataTableRowActionsMenu";

type CiDataTableRowActionsProps<TData> = {
  row: TData;
  actions: CiDataTableAction<TData>[];
  information?: CiDataTableInformation<TData>;
  context: CiDataTableRowActionContext<TData>;
  mode: "buttons" | "menu" | "mixed";
  inlineCount: number;
  menuLabel: string;
};

/** Renders row actions as buttons, a menu, or inline buttons plus overflow. */
export function CiDataTableRowActions<TData>({
  row,
  actions,
  information,
  context,
  mode,
  inlineCount,
  menuLabel,
}: CiDataTableRowActionsProps<TData>) {
  const visible = actions.filter((action) =>
    ciIsDataTableControlVisible(action, row)
  );
  const informationControl =
    information && ciIsDataTableControlVisible(information, row) ? (
      <CiDataTableInformationControl row={row} information={information} />
    ) : null;

  if (!visible.length && !informationControl) return null;
  if (mode === "menu") {
    return (
      <div className="flex items-center gap-2 whitespace-nowrap">
        {informationControl}
        {visible.length ? (
          <CiDataTableRowActionsMenu
            row={row}
            actions={visible}
            context={context}
            triggerAriaLabel={menuLabel}
          />
        ) : null}
      </div>
    );
  }

  const inline = mode === "buttons" ? visible : visible.slice(0, inlineCount);
  const overflow = mode === "mixed" ? visible.slice(inlineCount) : [];

  return (
    <div className="flex items-center gap-2 whitespace-nowrap">
      {informationControl}
      {inline.map((action) => {
        const disabled = ciIsDataTableControlDisabled(action, row);
        const iconOnly = action.display === "icon" && action.icon;
        const actionButton = (
          <Button
            type="button"
            size={iconOnly ? "icon-sm" : "sm"}
            variant={action.variant === "destructive" ? "destructive" : "ghost"}
            disabled={disabled}
            aria-label={iconOnly ? action.label : undefined}
            className={iconOnly ? "size-11" : "h-11"}
            onClick={() => void action.onSelect(row, context)}
          >
            {action.icon}
            {iconOnly ? null : action.label}
          </Button>
        );
        return iconOnly ? (
          <TooltipProvider key={action.id}>
            <Tooltip>
              <TooltipTrigger asChild>
                <span className="inline-flex">{actionButton}</span>
              </TooltipTrigger>
              <TooltipContent side="top">{action.label}</TooltipContent>
            </Tooltip>
          </TooltipProvider>
        ) : (
          <span key={action.id} className="inline-flex">
            {actionButton}
          </span>
        );
      })}
      {overflow.length ? (
        <CiDataTableRowActionsMenu
          row={row}
          actions={overflow}
          context={context}
          triggerAriaLabel={menuLabel}
        />
      ) : null}
    </div>
  );
}
