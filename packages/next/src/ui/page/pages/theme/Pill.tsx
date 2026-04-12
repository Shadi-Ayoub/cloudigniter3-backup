export function Pill({ children }: { children: React.ReactNode }) {
  return (
    <span className='inline-flex items-center rounded-full border border-black/10 px-2 py-0.5 font-mono text-[11px] leading-5 opacity-90 dark:border-white/10'>
      {children}
    </span>
  );
}
