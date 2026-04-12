'use client';

import { useEffect, useRef, useState } from 'react';
import Content, { type ContentHandle } from './Content';
import { type ManualMethodDefinition } from './types';

interface ContentPanelProps {
  selectedMethod: ManualMethodDefinition | null;
  loading: boolean;
}

const ContentPanel = ({ selectedMethod, loading }: ContentPanelProps) => {
  const [response, setResponse] = useState<string>('');
  const contentRef = useRef<ContentHandle>(null);

  useEffect(() => {
    if (!loading) {
      setResponse(JSON.stringify(selectedMethod, null, 2));
    }
  }, [selectedMethod, loading]);

  return (
    <div className='col-span-7 flex h-full flex-col overflow-hidden'>
      <div className='relative flex-grow rounded border border-gray-300 bg-gray-50 shadow dark:border-gray-700 dark:bg-gray-800'>
        {/* Content takes full available space */}
        <Content input={response} loading={loading} ref={contentRef} />
      </div>
    </div>
  );
};

export default ContentPanel;
