"use client";

import { useId, useMemo, useRef, useState } from "react";
import { ChevronDown, Search, X } from "lucide-react";
import { Input } from "@ci-ui/client";

export type CiSearchableChipOption = {
  id: string;
  label: string;
  description?: string;
};

export type CiSearchableChipSelectedItem = {
  id: string;
  label: string;
};

/** Search-first multi-select with removable chips and keyboard suggestions. */
export function CiSearchableChipMultiSelect({
  id,
  label,
  placeholder,
  options,
  selectedItems,
  emptyMessage = "No available matches.",
  showAllOptions = false,
  onAdd,
  onRemove,
}: {
  id: string;
  label: string;
  placeholder: string;
  options: readonly CiSearchableChipOption[];
  selectedItems: readonly CiSearchableChipSelectedItem[];
  emptyMessage?: string;
  /** Uses a button trigger and opens the complete option list immediately. */
  showAllOptions?: boolean;
  onAdd: (option: CiSearchableChipOption) => void;
  onRemove: (itemId: string) => void;
}) {
  const generatedId = useId();
  const listboxId = `${id}-${generatedId}-suggestions`;
  const inputRef = useRef<HTMLInputElement>(null);
  const [query, setQuery] = useState("");
  const [focused, setFocused] = useState(false);
  const [activeIndex, setActiveIndex] = useState(0);
  const matches = useMemo(() => {
    const normalizedQuery = query.trim().toLocaleLowerCase();
    if (!normalizedQuery && !showAllOptions) return [];
    const matchingOptions = normalizedQuery
      ? options.filter((option) =>
        `${option.label} ${option.description ?? ""} ${option.id}`
          .toLocaleLowerCase()
          .includes(normalizedQuery),
        )
      : options;
    const sortedOptions = [...matchingOptions].sort((left, right) =>
      left.label.localeCompare(right.label)
    );
    return showAllOptions ? sortedOptions : sortedOptions.slice(0, 10);
  }, [options, query, showAllOptions]);
  const open = focused && (showAllOptions || query.trim().length > 0);

  /** Adds one suggestion and keeps focus ready for another search. */
  const selectOption = (option: CiSearchableChipOption) => {
    onAdd(option);
    setQuery("");
    setActiveIndex(0);
    if (!showAllOptions) inputRef.current?.focus();
  };

  /** Removes one chip and returns keyboard focus to the search field. */
  const removeItem = (itemId: string) => {
    onRemove(itemId);
    if (!showAllOptions) inputRef.current?.focus();
  };

  return (
    <div className="relative grid gap-2">
      <p className="sr-only" aria-live="polite">
        {selectedItems.length} {label.toLocaleLowerCase()} selected.
      </p>
      {selectedItems.length > 0 ? (
        <div
          role="group"
          className="flex min-h-11 flex-wrap gap-2 rounded-lg border bg-muted/30 p-2"
          aria-label={`${label} selected values`}
        >
          {selectedItems.map((item) => (
            <span
              key={item.id}
              className="inline-flex min-h-8 max-w-full items-center gap-1 rounded-full border bg-background py-1 pr-1 pl-3 text-sm shadow-xs"
            >
              <span className="truncate">{item.label}</span>
              <button
                type="button"
                className="relative inline-flex size-9 shrink-0 cursor-pointer items-center justify-center rounded-full text-muted-foreground transition-colors hover:bg-destructive/10 hover:text-destructive focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none after:absolute after:-inset-1"
                aria-label={`Remove ${item.label}`}
                onClick={() => removeItem(item.id)}
              >
                <X className="size-3.5" aria-hidden="true" />
              </button>
            </span>
          ))}
        </div>
      ) : null}

      <div className="relative">
        {showAllOptions ? (
          <button
            id={id}
            type="button"
            role="combobox"
            aria-label={label}
            aria-expanded={open}
            aria-controls={listboxId}
            aria-activedescendant={
              open && matches[activeIndex]
                ? `${listboxId}-${matches[activeIndex].id}`
                : undefined
            }
            className="flex min-h-11 w-full cursor-pointer items-center justify-between rounded-lg border bg-background px-3 text-left text-sm shadow-xs transition-colors hover:bg-accent focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none"
            onClick={() => {
              setFocused((value) => !value);
              setActiveIndex(0);
            }}
            onBlur={() => setFocused(false)}
            onKeyDown={(event) => {
              if (event.key === "ArrowDown" && matches.length > 0) {
                event.preventDefault();
                setFocused(true);
                setActiveIndex((index) => (index + 1) % matches.length);
              } else if (event.key === "ArrowUp" && matches.length > 0) {
                event.preventDefault();
                setFocused(true);
                setActiveIndex(
                  (index) => (index - 1 + matches.length) % matches.length
                );
              } else if (event.key === "Enter" && open && matches[activeIndex]) {
                event.preventDefault();
                selectOption(matches[activeIndex]);
              } else if (event.key === "Escape") {
                setFocused(false);
              }
            }}
          >
            <span>{placeholder}</span>
            <ChevronDown className="size-4 text-muted-foreground" aria-hidden="true" />
          </button>
        ) : (
          <>
            <Search
              className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground"
              aria-hidden="true"
            />
            <Input
          ref={inputRef}
          id={id}
          role="combobox"
          aria-label={label}
          aria-autocomplete="list"
          aria-expanded={open}
          aria-controls={listboxId}
          aria-activedescendant={
            open && matches[activeIndex]
              ? `${listboxId}-${matches[activeIndex].id}`
              : undefined
          }
          value={query}
          className="pl-9"
          placeholder={placeholder}
          onFocus={() => setFocused(true)}
          onBlur={() => setFocused(false)}
          onChange={(event) => {
            setQuery(event.target.value);
            setActiveIndex(0);
          }}
          onKeyDown={(event) => {
            if (event.key === "ArrowDown" && matches.length > 0) {
              event.preventDefault();
              setActiveIndex((index) => (index + 1) % matches.length);
            } else if (event.key === "ArrowUp" && matches.length > 0) {
              event.preventDefault();
              setActiveIndex(
                (index) => (index - 1 + matches.length) % matches.length,
              );
            } else if (event.key === "Enter" && open && matches[activeIndex]) {
              event.preventDefault();
              selectOption(matches[activeIndex]);
            } else if (event.key === "Escape") {
              setQuery("");
            } else if (
              event.key === "Backspace" &&
              query.length === 0 &&
              selectedItems.length > 0
            ) {
              const lastItem = selectedItems[selectedItems.length - 1];
              if (lastItem) removeItem(lastItem.id);
            }
          }}
            />
          </>
        )}
      </div>

      {open ? (
        <div
          id={listboxId}
          role="listbox"
          aria-multiselectable="true"
          className="absolute top-full right-0 left-0 z-50 mt-1 max-h-64 overflow-y-auto rounded-lg border bg-popover p-1 text-popover-foreground shadow-lg"
        >
          {matches.length > 0 ? (
            matches.map((option, index) => (
              <button
                key={option.id}
                id={`${listboxId}-${option.id}`}
                type="button"
                role="option"
                tabIndex={-1}
                aria-selected="false"
                data-active={index === activeIndex}
                className="flex min-h-11 w-full cursor-pointer flex-col items-start rounded-md px-3 py-2 text-left text-sm transition-colors hover:bg-accent hover:text-accent-foreground data-[active=true]:bg-accent data-[active=true]:text-accent-foreground"
                onMouseDown={(event) => event.preventDefault()}
                onMouseEnter={() => setActiveIndex(index)}
                onClick={() => selectOption(option)}
              >
                <span className="font-medium">{option.label}</span>
                {option.description ? (
                  <span className="text-xs text-muted-foreground">
                    {option.description}
                  </span>
                ) : null}
              </button>
            ))
          ) : (
            <p className="px-3 py-4 text-sm text-muted-foreground">
              {emptyMessage}
            </p>
          )}
        </div>
      ) : null}
    </div>
  );
}
