'use client';

import { forwardRef, useImperativeHandle, useState } from 'react';

import { type SandboxMethodDefinition } from '@CI/types';

interface InputProps {
  selectedMethod: SandboxMethodDefinition;
}

export interface InputHandle {
  getInput: () => string;
  setInput: (input: string) => void;
}

const InputPanel = forwardRef<InputHandle, InputProps>(({ selectedMethod }, ref) => {
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
    <div className='col-span-2 grid grid-rows-1 gap-4'>
      {/* Lower Section - Editable Input Object */}
      <div className='min-h-[200px] rounded border border-gray-300 bg-gray-50 p-4 shadow dark:border-gray-700 dark:bg-gray-800'>
        <div className='rounded bg-yellow-500 p-2 text-white dark:bg-yellow-600'>
          <h2 className='text-lg font-semibold'>Input (JSON Format)</h2>
        </div>
        <textarea
          className={`mt-4 max-h-[600px] min-h-[350px] w-full resize-y overflow-x-auto overflow-y-auto rounded border border-gray-300 bg-white p-3 whitespace-nowrap text-gray-700 focus:ring-2 focus:ring-yellow-500 focus:outline-none dark:border-gray-600 dark:bg-gray-800 dark:text-gray-200 dark:focus:ring-yellow-400 ${selectedMethod.defaultInput === '' ? 'bg-gray-300 dark:bg-gray-700' : 'bg-white dark:bg-gray-800'}`}
          value={inputValue}
          onFocus={(e) => e.preventDefault()} // Prevent jumping to top
          onChange={(e) => setInputValue(e.target.value)}
          placeholder={
            selectedMethod.defaultInput === '' ? 'No input is required for this method...' : 'Enter input JSON here...'
          }
          disabled={selectedMethod.defaultInput === ''}
        />
      </div>
    </div>
  );
});

export default InputPanel;
