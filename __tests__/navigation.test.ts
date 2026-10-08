import { describe, expect, it } from 'bun:test';
import { readdirSync, readFileSync, statSync } from 'fs';
import { join } from 'path';

const TABS = ['home', 'journey', 'streak', 'settings'];

function sourceFiles(dir: string): string[] {
  return readdirSync(dir).flatMap((name) => {
    const path = join(dir, name);
    return statSync(path).isDirectory() ? sourceFiles(path) : /\.tsx?$/.test(name) ? [path] : [];
  });
}

describe('navigation: going back to a tab never stacks a second set of tabs', () => {
  // The tabs always sit under a level or the win screen. replace('/home') or <Redirect href="/home">
  // there swaps the top screen for a NEW tabs navigator, leaving two full sets mounted (one more on
  // every quit or MAP tap). Use router.dismissTo or <ReturnTo>. The splash is the one exception:
  // it has no tabs under it.
  const offenders = sourceFiles(join(import.meta.dir, '..', 'src'))
    .filter((f) => !f.replace(/\\/g, '/').endsWith('src/app/index.tsx'))
    .flatMap((f) => {
      const src = readFileSync(f, 'utf8');
      return TABS.flatMap((tab) => {
        const bad = [`replace('/${tab}')`, `replace("/${tab}")`, `Redirect href="/${tab}"`];
        return bad.filter((b) => src.includes(b)).map((b) => `${f}: ${b}`);
      });
    });

  it('no replace() or <Redirect> to a tab outside the splash', () => {
    expect(offenders).toEqual([]);
  });
});
