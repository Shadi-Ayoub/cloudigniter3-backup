"use client";

import { forwardRef, useImperativeHandle, useState } from "react";
import type { CiSandboxMethodDefinition } from "@cloudigniter/core/types";

interface InputProps {
  selectedMethod: CiSandboxMethodDefinition;
}

export interface InputHandle {
  getInput: () => string;
  setInput: (input: string) => void;
}

const InputPanel = forwardRef<InputHandle, InputProps>(
  ({ selectedMethod }, ref) => {
    const [inputValue, setInputValue] = useState(selectedMethod.defaultInput);

    useImperativeHandle(ref, () => ({
      getInput() {
        return inputValue; // Expose the textarea value to the parent
      },
      setInput(input: string) {
        setInputValue(input);
      },
    }));

    return (
      <div className="col-span-2 grid grid-rows-1 gap-4">
        {/* Lower Section - Editable Input Object */}
        <div className="min-h-[200px] rounded border border-border bg-surface text-surface-foreground p-4 shadow">
          <div className="rounded bg-warning-surface p-2 text-warning-surface-foreground">
            <h2 className="text-lg font-semibold">Input (JSON Format)</h2>
          </div>
          <textarea
            className={`mt-4 max-h-[600px] min-h-[350px] w-full resize-y overflow-x-auto overflow-y-auto rounded border border-input p-3 whitespace-nowrap text-foreground focus:ring-2 focus:ring-ring focus:outline-none ${
              selectedMethod.defaultInput === ""
                ? "bg-muted"
                : "bg-background"
            }`}
            value={inputValue}
            onFocus={(e) => e.preventDefault()} // Prevent jumping to top
            onChange={(e) => setInputValue(e.target.value)}
            placeholder={
              selectedMethod.defaultInput === ""
                ? "No input is required for this method..."
                : "Enter input JSON here..."
            }
            disabled={selectedMethod.defaultInput === ""}
          />
        </div>
      </div>
    );
  },
);

export default InputPanel;
