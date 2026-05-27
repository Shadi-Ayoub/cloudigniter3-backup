import { Card } from './Card';
import { Pill } from './Pill';

export const ANIMATE_VAR_NAMES = ['--animate-gradiant-shift', '--animate-flicker', '--animate-fade-in'] as const;

export function AnimationPreview() {
  return (
    <Card>
      <div className='grid gap-6 md:grid-cols-2'>
        <div>
          <div className='mb-2 font-medium'>Ping</div>
          <div className='relative h-28'>
            <div className='absolute inset-0 grid place-items-center'>
              <span className='relative inline-flex h-12 w-12 items-center justify-center rounded-full bg-[--color-primary] text-white'>
                <span
                  className='absolute inline-flex h-full w-full rounded-full'
                  style={{
                    animation: 'ci-ping 1.8s cubic-bezier(0,0,0.2,1) infinite',
                    background: 'var(--color-primary)',
                    opacity: 0.45,
                  }}
                />
                <span className='relative z-10 text-sm font-semibold'>CI</span>
              </span>
            </div>
          </div>
          <Pill>@keyframes ci-ping</Pill>
        </div>
        <div>
          <div className='mb-2 font-medium'>Pulse</div>
          <div className='relative h-28'>
            <div className='absolute inset-0 grid place-items-center'>
              <span
                className='relative inline-flex h-12 w-12 items-center justify-center rounded-full bg-[--color-accent] text-white'
                style={{ animation: 'ci-pulse 1.4s ease-in-out infinite' }}
              >
                <span className='relative z-10 text-sm font-semibold'>CI</span>
              </span>
            </div>
          </div>
          <Pill>@keyframes ci-pulse</Pill>
        </div>
      </div>
    </Card>
  );
}
