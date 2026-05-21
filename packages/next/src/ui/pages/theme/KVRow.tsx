export function KVRow({
  k,
  v,
  demo,
  varName,
  mounted,
}: {
  k: string;
  v: string;
  demo?: React.ReactNode;
  varName?: string;
  mounted: boolean;
}) {
  const caption = mounted && v && v.length ? v : varName ? `var(${varName})` : '';
  return (
    <div className='grid grid-cols-[1fr_auto_auto] items-center gap-3 rounded-lg border border-black/5 px-3 py-2 dark:border-white/10'>
      <div className='min-w-0'>
        <div className='truncate text-sm font-medium'>{k.replace('--', '')}</div>
        <div className='truncate font-mono text-[11px] opacity-70'>{caption}</div>
      </div>
      {demo ? <div className='justify-self-end'>{demo}</div> : null}
      <button
        className='justify-self-end rounded-md border border-black/10 px-2 py-1 text-xs font-medium hover:bg-black/5 dark:border-white/10 dark:hover:bg-white/10'
        onClick={() => navigator.clipboard.writeText(caption)}
      >
        Copy
      </button>
    </div>
  );
}
