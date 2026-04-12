import { LayoutClient } from './LayoutClient';
import type { CiPageConfig } from '@CI/types';

interface LayoutProps {
  config: CiPageConfig;
  protect?: boolean;
  children: React.ReactNode;
}

export default function Layout({ config, protect, children }: LayoutProps) {
  const shield = protect ?? true;

  return (
    <LayoutClient config={config} protect={shield}>
      {children}
    </LayoutClient>
  );
}
