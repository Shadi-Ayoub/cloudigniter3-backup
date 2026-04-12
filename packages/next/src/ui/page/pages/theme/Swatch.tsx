export function Swatch({
  name,
  label,
  value,
  varName,
  mounted,
}: {
  name: string;
  label?: string;
  value?: string;
  varName?: string;
  mounted: boolean;
}) {
  const bg = varName ? `var(${varName})` : (value ?? '');
  const caption = mounted && value && value.length ? value : varName ? `var(${varName})` : '';

  return (
    <div className='group flex items-center gap-3'>
      <div
        className='size-10 rounded-lg border border-black/10 shadow-sm dark:border-white/10'
        style={{ background: bg }}
        title={caption}
      />
      <div className='min-w-0'>
        <div className='truncate text-sm font-medium'>{label ?? name.replace('--', '')}</div>
        <div className='truncate font-mono text-[11px] opacity-70' title={`${name}: ${caption}`}>
          {name}: {caption || '(unset)'}
        </div>
      </div>
    </div>
  );
}
