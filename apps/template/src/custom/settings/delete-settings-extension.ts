import { ciRegisterSettings } from '@cloudigniter/next/server';

import type { CiSettingsRegistry, CiSettings } from '@cloudigniter/next/types';

declare module '@cloudigniter/next/server' {
  interface SettingsRegistryMap {
    lms: {
      defaults: CiSettings;
      validate?: (v: CiSettings) => string[];
    };
  }
}

export function registerCustomSettings(registry: CiSettingsRegistry) {
  ciRegisterSettings(registry, 'lms', {
    defaults: {
      grading: { passMark: 50 },
      attendance: { enabled: true },
    },
    validate: (v) => {
      const issues: string[] = [];
      const passMark = (v.grading as { passMark?: unknown } | undefined)
        ?.passMark;

      if (typeof passMark !== 'number' || passMark < 0 || passMark > 100) {
        issues.push('grading.passMark must be a number between 0 and 100.');
      }

      return issues;
    },
  });
}
