#!/usr/bin/env node
// build.mjs
import 'ts-node/esm';
import fs from 'fs';
import path from 'path';
import { execSync } from 'child_process';

const cwd = process.cwd();
const tsconfig = path.join(cwd, 'tsconfig.json');
const tsupBin = path.join(cwd, 'node_modules/.bin/tsup');
const tsupConfig = path.join(cwd, 'tsup.config.ts');
const tsconfigTypes = path.join(cwd, 'tsconfig.types.json');
const tsconfigBuild = path.join(cwd, 'tsconfig.build.json');
// const tailwindcssBin = path.join(cwd, 'node_modules/.bin/tailwindcss');
const srcLocales = path.join(cwd, 'src/locale');
const destLocales = path.join(cwd, 'dist/locale');
const srcStyles = path.join(cwd, 'src/ui/styles');
const destStyles = path.join(cwd, 'dist/styles');

console.log(`\n[build] cwd:              ${cwd}`);
console.log(`\n[build] Tsconfig file:    ${tsconfig}`);
console.log(`[build] TSUP binary:      ${tsupBin}`);
console.log(`[build] TSUP config file: ${tsupConfig}\n`);

// try {
//   require('ts-node').register({
//     transpileOnly: true,
//     esm: true,
//     project: tsconfig,
//     ignoreDiagnostics: [6133], // ignore that TS6133 error at load-time too
//   });
//   console.log('[build] ts-node registered');
// } catch (err) {
//   console.warn('[build] ts-node not found - run `npm i -D ts-node typescript`');
// }

// Clean by removing the current "dist" folder
try {
  execSync(`rm -rf dist`, { stdio: 'inherit' });
} catch (error) {
  console.error('❌ Failed to delete the existing "dist" folder!', error);
  process.exit(1);
}

try {
  execSync(`"${tsupBin}" --config "${tsupConfig}"`, {
    stdio: 'inherit',
    env: {
      ...process.env,
      // Ensure tsup bin stays loaded even if tsup forks node, and boost heap
      NODE_OPTIONS: ['--require ts-node/register', '--max-old-space-size=8192'].join(' '),
    },
  });
} catch (err) {
  console.error('❌ Build failed using TSUP!', err);
  process.exit(1);
}

// Generate types
// try {
//   console.log('📦 Building the shared types file…');
//   execSync(`tsc --project "${tsconfigTypes}"`, {
//     stdio: 'inherit',
//     env: {
//       ...process.env,
//       // Ensure tsup bin stays loaded even if tsup forks node, and boost heap
//       NODE_OPTIONS: ['--require ts-node/register', '--max-old-space-size=8192'].join(' '),
//     },
//   });
// } catch (err) {
//   console.error('❌ Shared types build failed', err);
//   process.exit(1);
// }

// Generate the declaration file for each TS file
// try {
//   console.log('📦 Building the declaration files…');
//   execSync(`tsc --project "${tsconfigBuild}"`, { stdio: 'inherit' });
// } catch (err) {
//   console.error('❌ Declaration files generation failed!', err);
//   process.exit(1);
// }

try {
  copyLocales();
  // generateLocaleIndex(); // Generate the locale index file
} catch (error) {
  console.error('❌ Locale creation failed!', error);
  process.exit(1);
}

// Copy Tailwind CSS files into dist/styles
// try {
//   // Build CSS files and copy them into dist/{esm,cjs}/styles
//   execSync(`"${tailwindcssBin}" -i ${srcStyles}/standard.css -o ${destStyles}/standard.css --minify`, {
//     stdio: 'inherit',
//     env: {
//       ...process.env,
//       // Ensure tailwindcss bin stays loaded even if tsup forks node, and boost heap
//       NODE_OPTIONS: ['--require ts-node/register', '--max-old-space-size=8192'].join(' '),
//     },
//   });
//   console.log('✅ Built Tailwind CSS via CLI\n');

//   console.log('\n[build] ✅ build complete\n');
// } catch (error) {
//   console.error('\n[build] ❌ build failed:', error);
//   process.exit(1);
// }

// // Generate types
// try {
//   console.log('📦 Building shared declaration files…');
//   execSync(`tsc --project "${tsconfigTypes}"`, { stdio: 'inherit' });
// } catch (err) {
//   console.error('❌ Declaration build failed', err);
//   process.exit(1);
// }

/**
 * Copy all folders and files from src/i18n/locale → dist/locale
 */
function copyLocales() {
  if (!fs.existsSync(srcLocales)) {
    console.warn('[copyLocales] no src/i18n/locale folder found');
    return;
  }

  fs.mkdirSync(destLocales, { recursive: true });

  // Copy entire directory tree (requires Node 16.7+)
  fs.cpSync(srcLocales, destLocales, {
    recursive: true,
    filter: (src, dest) => {
      return src.endsWith('.json') || fs.statSync(src).isDirectory() || src.endsWith('.d.ts');
    },
  });

  console.log('[copy] locale/ → dist/locale/ (all folders and JSON files)');
}

/**
 * Generates a Javascript index file that statically imports all JSON files
 * from src/locale/<locale>/<file>.json and builds a nested object structure
 * for dynamic access like locale[locale][file].
 */
function generateLocaleIndex() {
  const outputPath = path.resolve('dist/locale');
  const indexJsPath = path.join(outputPath, 'index.js');

  fs.mkdirSync(outputPath, { recursive: true });

  const imports = [];
  const localeStructure = {};

  for (const locale of fs.readdirSync(srcLocales)) {
    const localeDir = path.join(srcLocales, locale);
    if (!fs.statSync(localeDir).isDirectory()) continue;

    localeStructure[locale] = {};
    for (const file of fs.readdirSync(localeDir)) {
      if (!file.endsWith('.json')) continue;

      const baseName = path.basename(file, '.json');
      const importName = `${locale}_${baseName}`.replace(/[-.]/g, '_');
      const importPath = `./${locale}/${file}`;
      imports.push(`import ${importName} from '${importPath}';`);
      localeStructure[locale][baseName] = importName;
    }
  }

  const lines = [...imports, '', 'const locale = {'];

  for (const [loc, files] of Object.entries(localeStructure)) {
    lines.push(`  "${loc}": {`);
    for (const [name, v] of Object.entries(files)) {
      lines.push(`    "${name}": ${v},`);
    }
    lines.push('  },');
  }

  lines.push('};', '', 'export default locale;');

  fs.writeFileSync(indexJsPath, lines.join('\n'), 'utf8');
  console.log(`✅ Generated: ${indexJsPath}`);
}
