"use client";

import { useRef, useState } from "react";
import { CiSpinner } from "@cloudigniter/core/client";
import { type CiSandboxMethodDefinition } from "@cloudigniter/core/types";
import SidePanel from "./side-panel";
import OutputPanel from "./output-panel";
import InputPanel, { type InputHandle } from "./input-panel";

interface SandboxProps {
  methods: CiSandboxMethodDefinition[];
}

export function CiSandboxPage({ methods }: SandboxProps) {
  const [selectedMethod, setSelectedMethod] = useState(methods[0]);
  const [loading, setLoading] = useState(false);

  const handleSelectMethod = (method: CiSandboxMethodDefinition) => {
    setSelectedMethod(method);
    setInput(method.defaultInput);
  };

  const inputRef = useRef<InputHandle>(null);

  const getInput = () => {
    if (inputRef.current) {
      const inputTextValue = inputRef.current.getInput();
      return inputTextValue;
    }
    return "NULL";
  };

  const setInput = (input: string) => {
    if (inputRef.current) {
      inputRef.current.setInput(input);
    }
  };

  if (!selectedMethod) {
    return <div className="p-4">No sandbox methods are available.</div>;
  }

  return (
    <div className="mt-0 mb-16 grid flex-1 grid-cols-9 gap-4 overflow-hidden p-4">
      {loading && (
        <div className="bg-opacity-50 dark:bg-opacity-70 absolute inset-0 flex items-center justify-center bg-gray-900">
          <CiSpinner />
        </div>
      )}
      {/* Side Panel (1 column) */}
      <SidePanel handleSelectMethod={handleSelectMethod} methods={methods} />
      <OutputPanel
        getInput={getInput}
        selectedMethod={selectedMethod}
        setLoading={setLoading}
      />
      <InputPanel selectedMethod={selectedMethod} ref={inputRef} />
    </div>
  );
}
