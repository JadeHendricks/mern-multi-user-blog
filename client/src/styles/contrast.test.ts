// @vitest-environment node
import { fileURLToPath } from 'node:url';
import { compileString } from 'sass';
import { describe, expect, it } from 'vitest';

// Locks in the WCAG 2 AA contrast of the colour pairs the app really uses, computed from the real
// token values (compiled with Sass), so a token edit that breaks contrast fails here. It does not
// replace a manual check: it covers token pairs, not every rendered pixel.
// Thresholds: 4.5 for normal text, 3 for large text and for UI parts such as focus rings and borders.

const stylesDir = fileURLToPath(new URL('.', import.meta.url));

const colorNames = [
  'white', 'text', 'muted', 'grey', 'grey-light', 'border', 'surface', 'background',
  'yellow', 'yellow-dark', 'green', 'green-light', 'green-teal', 'red', 'blue',
  'focus', 'focus-inverse',
] as const;
type ColorName = (typeof colorNames)[number];

const readTokens = (): Record<ColorName, string> => {
  const body = colorNames.map((name, i) => `  --c${String(i)}: #{t.$color-${name}};`).join('\n');
  const { css } = compileString(`@use 'settings/tokens' as t;\n:root {\n${body}\n}`, { loadPaths: [stylesDir] });
  const tokens = {} as Record<ColorName, string>;
  for (const match of css.matchAll(/--c(\d+)\s*:\s*([^;]+);/g)) {
    const name = colorNames[Number(match[1])];
    if (name) tokens[name] = (match[2] ?? '').trim();
  }
  return tokens;
};

// '#abc' or '#aabbcc' -> [r, g, b]
const rgb = (hex: string): [number, number, number] => {
  const digits = /^#([0-9a-f]{3}|[0-9a-f]{6})$/i.exec(hex)?.[1];
  if (!digits) throw new Error(`not a hex colour: ${hex}`);
  const full = digits.length === 3 ? digits.replace(/./g, '$&$&') : digits;
  return [0, 2, 4].map((i) => parseInt(full.slice(i, i + 2), 16)) as [number, number, number];
};

const luminance = (hex: string): number => {
  const [r, g, b] = rgb(hex).map((channel) => {
    const c = channel / 255;
    return c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4;
  }) as [number, number, number];
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
};

const ratio = (a: string, b: string): number => {
  const [light, dark] = [luminance(a), luminance(b)].sort((x, y) => y - x) as [number, number];
  return (light + 0.05) / (dark + 0.05);
};

const tokens = readTokens();

// [foreground, background, minimum ratio, where it is used]
const pairs: [ColorName, ColorName, number, string][] = [
  ['muted', 'white', 4.5, 'labels, radio labels, recover-form text'],
  ['muted', 'background', 4.5, 'footer links, nav CTA hover text'],
  ['muted', 'surface', 4.5, 'input placeholder'],
  ['muted', 'border', 4.5, 'textarea placeholder'],
  ['grey', 'background', 4.5, 'footer copyright'],
  ['text', 'yellow', 4.5, 'edit page heading and description (top of the banner)'],
  ['text', 'yellow-dark', 4.5, 'edit page heading and description (bottom of the banner)'],
  ['grey-light', 'white', 3, 'radio circle border'],
  ['grey-light', 'background', 3, 'radio circle border on the page background'],
  ['focus', 'white', 3, 'focus ring on cards and forms'],
  ['focus', 'background', 3, 'focus ring on the page background'],
  ['focus', 'surface', 3, 'focus ring on inputs'],
  ['focus', 'green', 3, 'focus ring next to green buttons'],
  ['focus', 'green-light', 3, 'focus ring on the banner (light end)'],
  ['focus', 'green-teal', 3, 'focus ring on the banner (dark end)'],
  ['focus-inverse', 'text', 3, 'focus ring on the dark header'],
  ['white', 'red', 4.5, 'delete button'],
  ['blue', 'white', 4.5, 'link colour'],
  ['red', 'white', 3, 'heart icon'],
];

describe('colour contrast (WCAG 2 AA)', () => {
  it.each(pairs)('%s on %s is at least %s:1 (%s)', (fg, bg, minimum) => {
    expect(ratio(tokens[fg], tokens[bg])).toBeGreaterThanOrEqual(minimum);
  });

  it('measures black on white as 21:1, the reference value', () => {
    expect(ratio('#000', '#fff')).toBeCloseTo(21, 5);
  });
});
