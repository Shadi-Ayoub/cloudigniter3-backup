'use client';

import { useEffect, useState } from 'react';
import { getList } from './get-list';
import { type ManualMethodDefinition } from './types';

interface SidePanelProps {
  selectedMethod: ManualMethodDefinition | null;
  handleSelectMethod: (method: ManualMethodDefinition) => void;
}

const SidePanel = ({ selectedMethod, handleSelectMethod }: SidePanelProps) => {
  const [methodsList, setMethodsList] = useState<
    Record<string, ManualMethodDefinition[]>
  >({});
  const [apiFunctionsList, setApiFunctionsList] = useState<
    ManualMethodDefinition[]
  >([]);
  const [activeTab, setActiveTab] = useState<'methods' | 'api'>('methods');
  const [expandedGroups, setExpandedGroups] = useState<Record<string, boolean>>(
    {}
  );

  useEffect(() => {
    const list = getList();
    const groupedMethods: Record<string, ManualMethodDefinition[]> = {};
    const apiFunctions: ManualMethodDefinition[] = [];

    list.forEach((item) => {
      if (item.type === 'api') {
        apiFunctions.push(item as ManualMethodDefinition);
      } else {
        if (!groupedMethods[item.category]) {
          groupedMethods[item.category] = [];
        }
        groupedMethods[item.category].push(item as ManualMethodDefinition);
      }
    });

    setMethodsList(groupedMethods);
    setApiFunctionsList(apiFunctions);
  }, []);

  const toggleGroup = (category: string) => {
    setExpandedGroups((prev) => ({ ...prev, [category]: !prev[category] }));
  };

  return (
    <aside className='col-span-2 h-full overflow-y-auto rounded border border-gray-300 bg-gray-100 p-3 shadow-sm dark:border-gray-700 dark:bg-gray-900'>
      {/* Tabs */}
      <div className='flex border-b border-gray-300 dark:border-gray-700'>
        <button
          className={`flex-1 p-2 text-sm font-semibold ${activeTab === 'methods' ? 'border-b-2 border-blue-500 text-blue-500 dark:text-blue-400' : 'text-gray-700 dark:text-gray-300'}`}
          onClick={() => setActiveTab('methods')}
        >
          Methods
        </button>
        <button
          className={`flex-1 p-2 text-sm font-semibold ${activeTab === 'api' ? 'border-b-2 border-blue-500 text-blue-500 dark:text-blue-400' : 'text-gray-700 dark:text-gray-300'}`}
          onClick={() => setActiveTab('api')}
        >
          API Functions
        </button>
      </div>

      {activeTab === 'methods' ? (
        <ul className='mt-3 space-y-2'>
          {Object.entries(methodsList).map(([category, methods]) => (
            <li
              key={category}
              className='border-b border-gray-300 pb-2 dark:border-gray-700'
            >
              <div
                className='flex cursor-pointer items-center justify-between rounded p-2 hover:bg-gray-200 dark:hover:bg-gray-700'
                onClick={() => toggleGroup(category)}
              >
                <span className='text-sm font-semibold text-gray-700 dark:text-gray-300'>
                  {category}
                </span>
                <span className='text-gray-500 dark:text-gray-400'>
                  {expandedGroups[category] ? '−' : '+'}
                </span>
              </div>
              {expandedGroups[category] && (
                <ul className='mt-1 space-y-1 pl-4'>
                  {methods.map((method) => (
                    <li
                      key={method.id}
                      className={`cursor-pointer rounded px-2 py-1 text-sm leading-tight transition-colors ${
                        selectedMethod?.id === method.id
                          ? 'bg-blue-500 text-white dark:bg-blue-600'
                          : 'text-gray-700 hover:bg-gray-200 dark:text-gray-300 dark:hover:bg-gray-700'
                      }`}
                      onClick={() => handleSelectMethod(method)}
                    >
                      {method.label}
                    </li>
                  ))}
                </ul>
              )}
            </li>
          ))}
        </ul>
      ) : (
        <ul className='mt-3 space-y-1'>
          {apiFunctionsList.map((method) => (
            <li
              key={method.id}
              className={`cursor-pointer rounded px-2 py-1 text-sm leading-tight transition-colors ${
                selectedMethod?.id === method.id
                  ? 'bg-blue-500 text-white dark:bg-blue-600'
                  : 'text-gray-700 hover:bg-gray-200 dark:text-gray-300 dark:hover:bg-gray-700'
              }`}
              onClick={() => handleSelectMethod(method)}
            >
              {method.label}
            </li>
          ))}
        </ul>
      )}
    </aside>
  );
};

export default SidePanel;
