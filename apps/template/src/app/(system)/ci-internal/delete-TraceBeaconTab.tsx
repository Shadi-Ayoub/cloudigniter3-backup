// @cloudigniter/next/src/dev/TraceBeaconTab.tsx
'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import { ListTree, RefreshCw, Trash2 } from 'lucide-react';

type Event = {
  ts: number;
  seq: number;
  phase: string;
  name: string;
  level?: string;
  requestId?: string;
  traceId?: string;
  detail?: any;
  source?: string;
};

export function TraceTab() {
  const [events, setEvents] = useState<Event[]>([]);
  const [auto, setAuto] = useState(true);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const load = async () => {
    const r = await fetch('/api/trace', { cache: 'no-store' }).then((r) => r.json());
    setEvents(r.events ?? []);
  };
  const clear = async () => {
    await fetch('/api/trace', { method: 'DELETE' });
    setEvents([]);
  };

  useEffect(() => {
    load();
  }, []);
  useEffect(() => {
    if (auto) {
      timerRef.current = setInterval(load, 1500);
      return () => {
        if (timerRef.current) clearInterval(timerRef.current);
      };
    }
  }, [auto]);

  const rows = useMemo(() => events.slice().sort((a, b) => a.seq - b.seq), [events]);

  return (
    <div className='space-y-3 p-3 text-sm'>
      <div className='flex items-center gap-2'>
        <ListTree className='size-4' />
        <span className='font-medium'>Boot Trace</span>
        <div className='ml-auto flex items-center gap-2'>
          <button className='rounded-md border px-2 py-1' onClick={load} title='Refresh'>
            <RefreshCw className='size-4' />
          </button>
          <label className='flex cursor-pointer items-center gap-1'>
            <input type='checkbox' checked={auto} onChange={(e) => setAuto(e.target.checked)} />
            Auto
          </label>
          <button className='rounded-md border px-2 py-1 text-red-600' onClick={clear} title='Clear'>
            <Trash2 className='size-4' />
          </button>
        </div>
      </div>

      <div className='overflow-hidden rounded-lg border'>
        <table className='w-full text-xs'>
          <thead className='bg-muted sticky top-0'>
            <tr className='[&>th]:px-2 [&>th]:py-1 [&>th]:text-left'>
              <th>#</th>
              <th>Time</th>
              <th>Src</th>
              <th>Phase</th>
              <th>Name</th>
              <th>Req</th>
              <th>Trace</th>
              <th>Detail</th>
            </tr>
          </thead>
          <tbody className='[&>tr:nth-child(even)]:bg-muted/30'>
            {rows.map((e) => (
              <tr key={e.seq} className='[&>td]:px-2 [&>td]:py-1 [&>td]:align-top'>
                <td>{e.seq}</td>
                <td>{new Date(e.ts).toLocaleTimeString()}</td>
                <td className='uppercase'>{e.source?.[0]}</td>
                <td>{e.phase}</td>
                <td className={e.level === 'error' ? 'font-medium text-red-600' : ''}>{e.name}</td>
                <td>{e.requestId?.slice(0, 8)}</td>
                <td>{e.traceId?.slice(0, 8)}</td>
                <td>
                  <pre className='max-h-40 overflow-auto whitespace-pre-wrap'>
                    {typeof e.detail === 'string' ? e.detail : JSON.stringify(e.detail ?? {}, null, 2)}
                  </pre>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <p className='text-muted-foreground'>
        Dev-only. Endpoint: <code>/api/trace</code>
      </p>
    </div>
  );
}

/** Minimal adapter so you can append into your Dev Beacon tabs prop. */
export function getTraceBeaconTab() {
  return {
    id: 'trace',
    label: 'Trace',
    icon: ListTree,
    content: <TraceTab />,
  };
}
