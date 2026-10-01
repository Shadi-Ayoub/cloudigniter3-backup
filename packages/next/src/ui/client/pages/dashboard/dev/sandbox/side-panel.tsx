"use client";

import { useState } from "react";
import { FaInfoCircle } from "react-icons/fa";

import { type CiSandboxMethodDefinition } from "@cloudigniter/core/types";

interface SidePanelProps {
  methods: CiSandboxMethodDefinition[];
  handleSelectMethod: (method: CiSandboxMethodDefinition) => void;
}
const SidePanel = ({ methods, handleSelectMethod }: SidePanelProps) => {
  const [selectedMethod, setSelectedMethod] = useState(methods[0]);
  const [showDescription, setShowDescription] = useState(false);
  const [descriptionText, setDescriptionText] = useState("");

  if (!selectedMethod) {
    return <div className="p-4">No sandbox methods are available.</div>;
  }

  return (
    <>
      <aside className="col-span-2 rounded border border-border bg-surface text-surface-foreground p-4 shadow">
        <h2 className="bg-primary mb-4 rounded p-2 text-lg font-semibold text-primary-foreground">
          API Methods
        </h2>
        <ul>
          {methods.map((method) => (
            <li
              key={method.id}
              className={`mb-2 flex cursor-pointer items-center justify-between rounded p-2 ${
                selectedMethod.id === method.id
                  ? "bg-accent text-accent-foreground"
                  : "hover:bg-muted"
              }`}
              onClick={() => {
                setSelectedMethod(method);
                handleSelectMethod(method);
              }}
            >
              <span className="flex-1">{method.label}</span>
              <button
                onClick={(e) => {
                  e.stopPropagation(); // Prevent selecting method when clicking icon
                  setDescriptionText(method.description);
                  setShowDescription(true);
                }}
                className="text-current hover:text-primary"
              >
                <FaInfoCircle
                  className={`${
                    selectedMethod.id === method.id
                      ? "text-accent-foreground"
                      : "hover:bg-muted"
                  }`}
                />
              </button>
            </li>
          ))}
        </ul>
      </aside>
      {/* Description Modal */}
      {showDescription && (
        <div className="fixed inset-0 z-[999] flex items-center justify-center bg-black/50">
          <div className="w-1/3 rounded bg-popover p-6 text-popover-foreground shadow-lg">
            <h2 className="mb-4 text-lg font-semibold text-foreground">
              Description
            </h2>
            <p className="text-muted-foreground">
              {descriptionText}
            </p>
            <button
              onClick={() => setShowDescription(false)}
              className="mt-4 rounded bg-danger px-4 py-2 text-danger-foreground hover:bg-danger/90"
            >
              Close
            </button>
          </div>
        </div>
      )}
    </>
  );
};

export default SidePanel;
