'use client';

import { useState, useEffect } from 'react';
import SidePanel from './SidePanel';
import ContentPanel from './ContentPanel';
import { type ManualMethodDefinition } from './types';
import { getContent } from './get-content';
// import methods from './methods.json';

const initialSelectionId = 'get-user-server';

export function Manual() {
  const [selectedMethod, setSelectedMethod] =
    useState<ManualMethodDefinition | null>(null);
  const [loading, setLoading] = useState(false);

  const handleSelectMethod = async (
    method: Partial<ManualMethodDefinition>
  ) => {
    const content = (await getContent(
      method.id as string
    )) as ManualMethodDefinition;

    if (selectedMethod && method.id === selectedMethod.id) return; // Prevent unnecessary updates
    setLoading(true);

    // Simulate an async call to fetch method details
    await new Promise((resolve) => setTimeout(resolve, 1000));

    setSelectedMethod(content);
    setLoading(false);
  };

  useEffect(() => {
    const init = async () => {
      const initialSelection = (await getContent(
        initialSelectionId
      )) as ManualMethodDefinition;

      setSelectedMethod(initialSelection);
    };
    init();
  }, []);

  return (
    <div className='flex h-screen flex-col'>
      {/* Main Content */}
      <div className='grid flex-1 grid-cols-9 gap-4 overflow-hidden p-4'>
        {/* Side Panel (2 columns) */}
        <SidePanel
          selectedMethod={selectedMethod}
          handleSelectMethod={handleSelectMethod}
        />

        {/* Content Panel (7 columns) */}
        <ContentPanel selectedMethod={selectedMethod} loading={loading} />
      </div>

      {/* Footer */}
      <footer className='flex h-8'></footer>
    </div>
  );
}
