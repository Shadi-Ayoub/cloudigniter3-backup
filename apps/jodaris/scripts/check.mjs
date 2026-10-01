#!/usr/bin/env node
// Dependency-free structural checks. This is not a browser or accessibility audit.
import fs from 'node:fs';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import {createHash} from 'node:crypto';
import vm from 'node:vm';
const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
let failures=0, checks=0;
function check(ok, label) { checks++; console.log(`${ok?'PASS':'FAIL'} ${label}`); if(!ok) failures++; }
function read(p) { return fs.readFileSync(path.join(root,p),'utf8'); }
try {
  const args=process.argv.slice(2);
  if(args.some(a=>a!=='--baseline')) throw new Error('Usage: node scripts/check.mjs [--baseline]');
  const html=read('index.html');
  check(/^<!doctype html>/i.test(html.trimStart()), 'HTML document starts with a doctype');
  check(/<html\s[^>]*lang="en"/.test(html), 'English document language');
  check(/name="viewport"/.test(html), 'Responsive viewport metadata');
  check(!/<script\b[^>]*\bsrc\s*=/i.test(html), 'No external script dependency');
  check(!/<link\b[^>]*rel=["']stylesheet["']/i.test(html), 'No external stylesheet dependency');
  const ids=[...html.matchAll(/\bid="([^"]+)"/g)].map(m=>m[1]);
  check(new Set(ids).size===ids.length, 'No duplicate double-quoted HTML IDs');
  const referenced=[...html.matchAll(/\bhref="#([^"]+)"/g)].map(m=>m[1]);
  check(referenced.every(id=>ids.includes(id)), 'Fragment links and SVG uses reference existing IDs');
  const aria=[...html.matchAll(/\baria-(?:labelledby|describedby|controls)="([^"]+)"/g)]
    .flatMap(m=>m[1].trim().split(/\s+/));
  check(aria.every(id=>ids.includes(id)), 'ARIA ID references exist');
  const scripts=[...html.matchAll(/<script\b([^>]*)>([\s\S]*?)<\/script>/gi)];
  let jsCount=0;
  for(const [_, attrs, js] of scripts){
    if(/type=["']application\/ld\+json["']/.test(attrs)){JSON.parse(js);continue;}
    new vm.Script(js,{filename:`index.html:inline-${++jsCount}`});
  }
  check(jsCount>0, 'Inline JavaScript parses without execution');
  const ref='.agents/skills/jodaris-development/references/';
  const tokenDoc=JSON.parse(read(ref+'design-tokens.json'));
  const currentTokens=Object.fromEntries([...html.match(/:root\s*\{([\s\S]*?)\}/)[1]
    .matchAll(/(--[a-z-]+):\s*([^;]+);/g)].map(m=>[m[1],m[2]]));
  check(JSON.stringify(currentTokens)===JSON.stringify(tokenDoc.tokens), 'Design token snapshot matches CSS');
  const inventory=JSON.parse(read(ref+'content-inventory.json'));
  check([...html.matchAll(/\bdata-capability="[^"]+"/g)].length===4, 'HTML contains four capability cards');
  check([...html.matchAll(/\brole="tab"/g)].length===4, 'HTML contains four approach tabs');
  check(inventory.expertise.disciplines.length===4, 'Content inventory contains four disciplines');
  check(inventory.approach.steps.length===4, 'Content inventory contains four approach steps');
  check(inventory.contact_email==='shadi@jodaris.com' && html.includes('mailto:'+inventory.contact_email),
    'Initial contact email is consistent');
  const title=html.match(/<title>([\s\S]*?)<\/title>/i)?.[1];
  check(title===inventory.metadata.title, 'Document title matches the content inventory');
  const skill=read('.agents/skills/jodaris-development/SKILL.md');
  check(/^---\s*\nname: jodaris-development\n/.test(skill) && /^description: .+/m.test(skill),
    'Development skill contains name and description metadata');
  for(const m of skill.matchAll(/\]\((references\/[^)]+)\)/g)){
    check(fs.existsSync(path.join(root,'.agents/skills/jodaris-development',m[1])), 'Skill reference exists: '+m[1]);
  }
  const png=fs.readFileSync(path.join(root,'jodaris-desktop-hero.png'));
  check(png.subarray(0,8).equals(Buffer.from([137,80,78,71,13,10,26,10])), 'Design reference is a PNG');
  if(args.includes('--baseline')){
    const baseline=JSON.parse(read('docs/baseline-manifest.json'));
    for(const [file,expected] of Object.entries(baseline.sha256)){
      const actual=createHash('sha256').update(fs.readFileSync(path.join(root,file))).digest('hex');
      check(actual===expected, 'Original asset unchanged: '+file);
    }
  }
  console.log(`\n${checks-failures}/${checks} structural checks passed.`);
  console.log('Not tested here: browser rendering, accessibility conformance, Mac installation, or Graphify graph generation.');
  process.exitCode=failures?1:0;
}catch(error){console.error('CHECK ERROR:',error.message);process.exitCode=1;}
