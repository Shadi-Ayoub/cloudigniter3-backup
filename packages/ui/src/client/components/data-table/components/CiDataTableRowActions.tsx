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
  reserveSpace: boolean;
};

/** Reserves one non-interactive icon slot to keep row controls aligned. */
function ActionSpacer() {
  return <span aria-hidden className="inline-flex size-11 shrink-0" />;
}

/** Renders row actions as buttons, a menu, or inline buttons plus overflow. */
export function CiDataTableRowActions<TData>({
  row,
  actions,
  information,
  context,
  mode,
  inlineCount,
  menuLabel,
  reserveSpace,
}: CiDataTableRowActionsProps<TData>) {
  const visible = actions.filter((action) =>
    ciIsDataTableControlVisible(action, row)
  );
  const informationIsVisible = information
    ? ciIsDataTableControlVisible(information, row)
    : false;
  const informationControl = information ? (
    informationIsVisible ? (
      <CiDataTableInformationControl row={row} information={information} />
    ) : reserveSpace ? (
      <ActionSpacer />
    ) : null
  ) : null;
  const hasReservableControls = Boolean(information) || actions.length > 0;

  if (
    !visible.length &&
    !informationControl &&
    (!reserveSpace || !hasReservableControls)
  )
    return null;
  if (mode === "menu") {
    return (
      <div className="flex items-center justify-end gap-2 whitespace-nowrap">
        {informationControl}
        {visible.length ? (
          <CiDataTableRowActionsMenu
            row={row}
            actions={visible}
            context={context}
            triggerAriaLabel={menuLabel}
          />
        ) : reserveSpace && actions.length ? (
          <ActionSpacer />
        ) : null}
      </div>
    );
  }

  const inlineSlots = reserveSpace
    ? (mode === "buttons" ? actions : actions.slice(0, inlineCount)).map(
        (action) => ({
          action,
          visible: ciIsDataTableControlVisible(action, row),
        })
      )
    : (mode === "buttons" ? visible : visible.slice(0, inlineCount)).map(
        (action) => ({ action, visible: true })
      );
  const overflowCandidates =
    mode === "mixed"
      ? reserveSpace
        ? actions.slice(inlineCount)
        : visible.slice(inlineCount)
      : [];
  const overflow = overflowCandidates.filter((action) =>
    ciIsDataTableControlVisible(action, row)
  );

  return (
    <div className="flex items-center justify-end gap-2 whitespace-nowrap">
      {informationControl}
      {inlineSlots.map(({ action, visible: actionIsVisible }) => {
        if (!actionIsVisible) {
          return <ActionSpacer key={action.id} />;
        }
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
      ) : reserveSpace && overflowCandidates.length ? (
        <ActionSpacer />
      ) : null}
    </div>
  );
}
