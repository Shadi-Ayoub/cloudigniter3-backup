"use client";

import { useRef, useState, type Dispatch, type SetStateAction } from "react";
import { FaPlay, FaTrash } from "react-icons/fa";

import Output, { type OutputHandle } from "./output";
import {
  type CiResponse,
  type CiSandboxMethodDefinition,
} from "@cloudigniter/core/types";

interface OutputPanelProps {
  getInput: () => string;
  selectedMethod: CiSandboxMethodDefinition;
  setLoading: Dispatch<SetStateAction<boolean>>;
}

const OutputPanel = ({
  getInput,
  selectedMethod,
  setLoading,
}: OutputPanelProps) => {
  const [response, setResponse] = useState<string>("");

  const getCurrentDateTime = () => {
    return new Date().toLocaleString("en-US", {
      weekday: "long", // e.g., "Monday"
      year: "numeric", // e.g., "2025"
      month: "long", // e.g., "December"
      day: "numeric", // e.g., "25"
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
      hour12: true, // Use 12-hour format
    });
  };

  const runMethod = async () => {
    try {
      setLoading(true);
      let input = getInput().trim();
      input = input.replace(/[\r\n]+/g, "").replace(/[\u201C\u201D]/g, '"');

      let result: CiResponse;

      if (input === "") {
        result = await (selectedMethod.callback as () => Promise<CiResponse>)();
      } else {
        result = await (
          selectedMethod.callback as (input: string) => Promise<CiResponse>
        )(input);
      }

      setResponse(
        "\n[" + getCurrentDateTime() + "]:\n" + JSON.stringify(result, null, 2),
      );

      setLoading(false);
    } catch (error) {
      alert(`Error: ${error}`);
      console.log(error);
      setLoading(false);
    }
  };

  const outputRef = useRef<OutputHandle>(null);

  const clearOutput = () => {
    if (outputRef.current) {
      outputRef.current.clearOutput();
    }
  };

  return (
    <div className="col-span-5 grid grid-rows-1 gap-4">
      {/* Upper Section - Display Output */}
      <div className="relative min-h-[200px] rounded border border-gray-300 bg-gray-50 p-4 shadow dark:border-gray-700 dark:bg-gray-800">
        <div className="flex items-center justify-between rounded bg-green-500 p-2 text-white dark:bg-green-700">
          <h2 className="text-lg font-semibold">Output (Response type)</h2>
          <div className="flex items-center gap-2">
            <button
              onClick={runMethod}
              className="hover:text-gray-300 dark:hover:text-gray-400"
            >
              <FaPlay />
            </button>
            <button
              onClick={clearOutput}
              className="hover:text-gray-300 dark:hover:text-gray-400"
            >
              <FaTrash />
            </button>
          </div>
        </div>
        <Output input={response} ref={outputRef} />
      </div>
    </div>
  );
};

export default OutputPanel;
