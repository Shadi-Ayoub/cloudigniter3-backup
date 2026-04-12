'use client';

import React from 'react';

import { ANIMATE_VAR_NAMES, AnimationPreview } from './animation';
import { Card } from './Card';
import { KVRow } from './KVRow';
import { Pill } from './Pill';
import { Section } from './Section';
import { Scale } from './Scale';
import { Swatch } from './Swatch';
import { BASE_DARK_KEYS, BASE_LIGHT_KEYS, BASE_LIGHT_LABELS, SCALE_PREFIXES, STATES } from './colors'; // Color related constants
import { SPACING_VARS, ZINDEX_VARS } from './spacing-z-index'; // Spacing related constants
import { readVar, useMounted } from './utils';

type Snapshot = {
  base: Record<string, string>;
  baseLabels: typeof BASE_LIGHT_LABELS;
  baseDark: Record<string, string>;
  spacing: Record<string, string>;
  zindex: Record<string, string>;
  states: Record<string, Record<string, string>>;
  animations: { name: string; value: string }[];
};

function makeInitialSnapshot(): Snapshot {
  // empty strings so SSR and first client render have identical text
  const emptyBy = (keys: readonly string[]) => Object.fromEntries(keys.map((k) => [k, '']));
  const base = emptyBy(BASE_LIGHT_KEYS as unknown as string[]);
  const baseDark = emptyBy(BASE_DARK_KEYS as unknown as string[]);
  const spacing = emptyBy(SPACING_VARS as unknown as string[]);
  const zindex = emptyBy(ZINDEX_VARS as unknown as string[]);

  const states: Snapshot['states'] = Object.fromEntries(
    STATES.map((key) => {
      const bg = `--color-${key}-background`;
      const fg = `--color-${key}-foreground`;
      const bgDark = `--color-${key}-background-dark`;
      const fgDark = `--color-${key}-foreground-dark`;
      return [key, { [bg]: '', [fg]: '', [bgDark]: '', [fgDark]: '' }];
    })
  );

  const animations = ANIMATE_VAR_NAMES.map((name) => ({ name, value: '' }));

  return {
    base,
    baseLabels: BASE_LIGHT_LABELS,
    baseDark,
    spacing,
    zindex,
    states,
    animations,
  };
}

function readSnapshot(): Snapshot {
  const read = (n: string) => readVar(n);
  const base = Object.fromEntries(BASE_LIGHT_KEYS.map((k) => [k, read(k)]));
  const baseDark = Object.fromEntries(BASE_DARK_KEYS.map((k) => [k, read(k)]));
  const spacing = Object.fromEntries(SPACING_VARS.map((k) => [k, read(k)]));
  const zindex = Object.fromEntries(ZINDEX_VARS.map((k) => [k, read(k)]));

  const states = Object.fromEntries(
    STATES.map((key) => {
      const bg = `--color-${key}-background`;
      const fg = `--color-${key}-foreground`;
      const bgDark = `--color-${key}-background-dark`;
      const fgDark = `--color-${key}-foreground-dark`;
      return [key, { [bg]: read(bg), [fg]: read(fg), [bgDark]: read(bgDark), [fgDark]: read(fgDark) }];
    })
  );

  const animations = ANIMATE_VAR_NAMES.map((name) => ({ name, value: read(name) }));

  return { base, baseLabels: BASE_LIGHT_LABELS, baseDark, spacing, zindex, states, animations };
}

export function ThemePresentationPage() {
  const mounted = useMounted();

  // Start with empty snapshot (SSR-safe), fill in after mount.
  const [snapshot, setSnapshot] = React.useState<Snapshot>(() => makeInitialSnapshot());

  React.useEffect(() => {
    if (!mounted) return;
    setSnapshot(readSnapshot());
  }, [mounted]);

  const handleRefresh = React.useCallback(() => {
    setSnapshot(readSnapshot());
  }, []);

  const jsonForCopy = React.useMemo(() => {
    return JSON.stringify(
      {
        spacing: snapshot.spacing,
        zindex: snapshot.zindex,
        base: snapshot.base,
        baseDark: snapshot.baseDark,
        states: snapshot.states,
        animations: snapshot.animations,
      },
      null,
      2
    );
  }, [snapshot]);

  const [showRaw, setShowRaw] = React.useState(false);

  return (
    <>
      {/* Sticky header just under your breadcrumb/header heights */}
      <div className='z-raised bg-background/80 supports-[backdrop-filter]:bg-background/60 sticky mx-0 mb-6 border-b border-black/10 backdrop-blur dark:border-white/10'>
        <div className='mx-auto flex max-w-7xl flex-wrap items-center gap-3 px-6 py-3'>
          <h1 className='text-2xl font-bold tracking-tight'>Theme Tokens</h1>
          <div className='ml-auto flex items-center gap-2'>
            <button
              onClick={() => navigator.clipboard.writeText(jsonForCopy)}
              className='rounded-md border border-black/10 px-3 py-1.5 text-sm font-medium hover:bg-black/5 dark:border-white/10 dark:hover:bg-white/10'
            >
              Copy JSON
            </button>
            <button
              onClick={handleRefresh}
              className='rounded-md border border-black/10 px-3 py-1.5 text-sm font-medium hover:bg-black/5 dark:border-white/10 dark:hover:bg-white/10'
              title='Re-read tokens'
            >
              Refresh
            </button>
            <label className='inline-flex items-center gap-2 text-sm'>
              <input
                type='checkbox'
                className='accent-[--color-primary]'
                checked={showRaw}
                onChange={(e) => setShowRaw(e.target.checked)}
              />
              Show raw names
            </label>
          </div>
        </div>
      </div>

      <div className='mx-auto max-w-7xl space-y-10'>
        {/* Base Colors (Light) */}
        <Section title='Base Colors (Light)'>
          <Card>
            <div className='grid gap-4 sm:grid-cols-2 lg:grid-cols-3'>
              {Object.entries(snapshot.base).map(([name, value]) => (
                <Swatch
                  key={name}
                  name={name}
                  label={snapshot.baseLabels[name]}
                  value={value as string}
                  varName={name}
                  mounted={mounted}
                />
              ))}
            </div>
          </Card>
        </Section>

        {/* Base Colors (Dark palette names) */}
        <Section title='Base Colors (Dark palette names)'>
          <Card>
            <div className='grid gap-4 sm:grid-cols-2 lg:grid-cols-3'>
              {Object.entries(snapshot.baseDark).map(([name, value]) => (
                <Swatch key={name} name={name} value={value as string} varName={name} mounted={mounted} />
              ))}
            </div>
            <p className='mt-3 text-sm opacity-80'>
              These are *named* dark tokens. Your app may still use the light tokens at runtime unless a `.dark` class
              flips usage.
            </p>
          </Card>
        </Section>

        {/* Color Scales */}
        <Section title='Color Scales'>
          <div className='space-y-6'>
            {SCALE_PREFIXES.map((p) => (
              <Scale key={p} prefix={p} mounted={mounted} />
            ))}
          </div>
        </Section>

        {/* State Colors (Light / Dark) */}
        <Section title='State Colors (Light / Dark)'>
          <div className='grid gap-6 md:grid-cols-2 lg:grid-cols-4'>
            {STATES.map((key) => {
              const lightBgVar = `--color-${key}-background`;
              const lightFgVar = `--color-${key}-foreground`;
              const darkBgVar = `--color-${key}-background-dark`;
              const darkFgVar = `--color-${key}-foreground-dark`;

              const lightBgCaption = mounted ? readVar(lightBgVar) || `var(${lightBgVar})` : `var(${lightBgVar})`;
              const lightFgCaption = mounted ? readVar(lightFgVar) || `var(${lightFgVar})` : `var(${lightFgVar})`;
              const darkBgCaption = mounted ? readVar(darkBgVar) || `var(${darkBgVar})` : `var(${darkBgVar})`;
              const darkFgCaption = mounted ? readVar(darkFgVar) || `var(${darkFgVar})` : `var(${darkFgVar})`;

              return (
                <Card key={key}>
                  <div className='mb-2 flex items-center justify-between'>
                    <h3 className='font-semibold capitalize'>{key}</h3>
                    <Pill>Light</Pill>
                  </div>
                  <div
                    className='mb-3 rounded-lg p-3 text-sm'
                    style={{ background: `var(${lightBgVar})`, color: `var(${lightFgVar})` }}
                    title={`${lightBgVar}: ${lightBgCaption} | ${lightFgVar}: ${lightFgCaption}`}
                  >
                    Background/Foreground
                  </div>
                  <div className='mb-2 flex items-center justify-between'>
                    <div className='font-medium'>Dark</div>
                    <Pill>Dark</Pill>
                  </div>
                  <div
                    className='rounded-lg p-3 text-sm'
                    style={{ background: `var(${darkBgVar})`, color: `var(${darkFgVar})` }}
                    title={`${darkBgVar}: ${darkBgCaption} | ${darkFgVar}: ${darkFgCaption}`}
                  >
                    Background/Foreground
                  </div>
                </Card>
              );
            })}
          </div>
        </Section>

        {/* Layout Spacing */}
        <Section title='Layout Spacing'>
          <Card>
            <div className='grid gap-3'>
              {Object.entries(snapshot.spacing).map(([k, v]) => {
                const widthStyle = mounted && v && v.length ? v : `var(${k})`;
                return (
                  <KVRow
                    key={k}
                    k={showRaw ? k : k.replace('--spacing-', '').replaceAll('-', ' ')}
                    v={v as string}
                    varName={k}
                    mounted={mounted}
                    demo={<div className='h-2 rounded bg-[--color-primary]' style={{ width: widthStyle }} />}
                  />
                );
              })}
            </div>
          </Card>
        </Section>

        {/* Z-Index Levels */}
        <Section title='Z-Index Levels'>
          <Card>
            <div className='grid gap-3'>
              {Object.entries(snapshot.zindex).map(([k, v]) => {
                const caption = mounted && v && v.length ? v : `var(${k})`;
                return (
                  <KVRow
                    key={k}
                    k={showRaw ? k : k.replace('--z-index-', 'z-')}
                    v={caption}
                    varName={k}
                    mounted={mounted}
                    demo={
                      <div className='relative h-8 w-40'>
                        <span className='absolute inset-0 rounded bg-[--color-muted-200]' />
                        <span className='absolute top-1/2 left-2 -translate-y-1/2 rounded bg-[--color-accent-100] px-1.5 font-mono text-xs'>
                          {caption}
                        </span>
                      </div>
                    }
                  />
                );
              })}
            </div>
          </Card>
        </Section>

        {/* Motion / Animations */}
        <Section title='Motion / Animations'>
          <AnimationPreview />
          <div className='mt-4 grid gap-3 md:grid-cols-2'>
            {snapshot.animations.map((a) => (
              <KVRow key={a.name} k={a.name} v={a.value} varName={a.name} mounted={mounted} />
            ))}
          </div>
          <p className='mt-2 text-xs opacity-70'>
            Note: if your gradient animation isn't running, double-check the spelling of the keyframes name (gradient vs
            gradiant).
          </p>
        </Section>
      </div>
    </>
  );
}
