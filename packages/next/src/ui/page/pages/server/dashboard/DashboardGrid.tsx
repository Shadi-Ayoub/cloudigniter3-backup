import { type ReactNode } from 'react';

interface DashboardGridProps {
  children: ReactNode;
}

export function DashboardGrid({ children }: DashboardGridProps) {
  return (
    <div className='dashboard-container'>
      <div className='dashboard-grid'>{children}</div>
    </div>
  );
}
