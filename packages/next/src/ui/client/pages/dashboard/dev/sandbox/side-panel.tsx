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
      <aside className="col-span-2 rounded border border-gray-300 bg-gray-100 p-4 shadow dark:border-gray-700 dark:bg-gray-800">
        <h2 className="bg-primary-500 dark:bg-primary-700 mb-4 rounded p-2 text-lg font-semibold text-white">
          API Methods
        </h2>
        <ul>
          {methods.map((method) => (
            <li
              key={method.id}
              className={`mb-2 flex cursor-pointer items-center justify-between rounded p-2 ${
                selectedMethod.id === method.id
                  ? "bg-primary-300 dark:bg-primary-500 text-white dark:text-white"
                  : "hover:bg-gray-200 dark:hover:bg-gray-700"
              }`}
              onClick={() => {
                setSelectedMethod(method);
                handleSelectMethod(method);
              }}
            >
              <span className="flex-1 dark:text-gray-200">{method.label}</span>
              <button
                onClick={(e) => {
                  e.stopPropagation(); // Prevent selecting method when clicking icon
                  setDescriptionText(method.description);
                  setShowDescription(true);
                }}
                className="text-gray-700 hover:text-blue-500 dark:text-gray-300 dark:hover:text-blue-400"
              >
                <FaInfoCircle
                  className={`${
                    selectedMethod.id === method.id
                      ? "text-white dark:text-white"
                      : "hover:bg-gray-200 dark:hover:bg-gray-700"
                  }`}
                />
              </button>
            </li>
          ))}
        </ul>
      </aside>
      {/* Description Modal */}
      {showDescription && (
        <div className="bg-opacity-50 dark:bg-opacity-70 fixed inset-0 z-[999] flex items-center justify-center bg-gray-900 dark:bg-black">
          <div className="w-1/3 rounded bg-white p-6 shadow-lg dark:bg-gray-800 dark:text-gray-200">
            <h2 className="mb-4 text-lg font-semibold text-gray-900 dark:text-gray-100">
              Description
            </h2>
            <p className="text-gray-700 dark:text-gray-300">
              {descriptionText}
            </p>
            <button
              onClick={() => setShowDescription(false)}
              className="mt-4 rounded bg-red-500 px-4 py-2 text-white hover:bg-red-700 dark:bg-red-600 dark:hover:bg-red-800"
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
