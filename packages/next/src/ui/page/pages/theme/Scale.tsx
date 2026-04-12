import { Card } from './Card';
import { Pill } from './Pill';
import { SHADES } from './colors';
import { readVar } from './utils';

export function Scale({ prefix, mounted }: { prefix: string; mounted: boolean }) {
  return (
    <Card>
      <div className='mb-3 flex items-center justify-between'>
        <h3 className='font-semibold'>{prefix}</h3>
        <Pill>{SHADES.length} shades</Pill>
      </div>
      <div className='grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-6 lg:grid-cols-11'>
        {SHADES.map((s) => {
          const varName = `--color-${prefix}-${s}`;
          const caption = mounted ? readVar(varName) || `var(${varName})` : `var(${varName})`;
          return (
            <div key={varName} className='space-y-2'>
              <div
                className='h-16 w-full rounded-lg border border-black/10 shadow-sm dark:border-white/10'
                style={{ background: `var(${varName})` }}
                title={caption}
              />
              <div className='font-mono text-xs opacity-80'>{s}</div>
            </div>
          );
        })}
      </div>
    </Card>
  );
}
