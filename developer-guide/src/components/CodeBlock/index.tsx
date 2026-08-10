import React from "react";
import { default as DocusaurusCodeBlock } from "@theme/CodeBlock";
import { CodeIcon } from "lucide-react"; // Use any icon library

interface CustomCodeBlockProps {
  title?: string;
  children: React.ReactNode;
}

const CodeBlock = ({ title, children }: CustomCodeBlockProps) => {
  return (
    <div className="relative border rounded-lg overflow-hidden">
      {title && (
        <div className="flex items-center bg-gray-100 text-gray-700 px-4 py-2 font-medium">
          <CodeIcon className="w-5 h-5 mr-2 text-blue-400" />
          {title}
        </div>
      )}
      <DocusaurusCodeBlock className="m-0 p-0" children={children} />
    </div>
  );
};

export default CodeBlock;
