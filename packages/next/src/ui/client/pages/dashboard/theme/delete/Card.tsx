export function Card({ children }: { children: React.ReactNode }) {
  return (
    <div className='rounded-2xl border border-black/10 bg-white/60 p-4 shadow-sm backdrop-blur dark:border-white/10 dark:bg-white/5'>
      {children}
    </div>
  );
}
