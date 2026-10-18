// @vitest-environment node
import { fileURLToPath } from 'node:url';
import { compile, compileString } from 'sass';
import { describe, expect, it } from 'vitest';

const stylesDir = fileURLToPath(new URL('.', import.meta.url));

// Reads the :root block that main.scss emits.
const emittedProperties = (): Map<string, string> => {
  const { css } = compile(fileURLToPath(new URL('main.scss', import.meta.url)));
  const block = /:root\s*\{([^}]*)\}/.exec(css);
  expect(block, ':root block is missing from the compiled CSS').not.toBeNull();
  const props = new Map<string, string>();
  for (const match of (block?.[1] ?? '').matchAll(/(--[a-z0-9-]+)\s*:\s*([^;]+);/g)) {
    props.set(match[1] ?? '', (match[2] ?? '').trim());
  }
  return props;
};

// Asks Sass for the value of the variable with the same name as each custom property
// (--space-15 -> $space-15) by compiling a probe stylesheet.
const sassValues = (names: string[]): Map<string, string> => {
  const body = names.map((name, i) => `  --p${String(i)}: #{tokens.$${name.slice(2)}};`).join('\n');
  const { css } = compileString(`@use 'settings/tokens';\n:root {\n${body}\n}`, { loadPaths: [stylesDir] });
  const values = new Map<string, string>();
  for (const match of css.matchAll(/--p(\d+)\s*:\s*([^;]+);/g)) {
    values.set(names[Number(match[1])] ?? '', (match[2] ?? '').trim());
  }
  return values;
};

describe('design tokens', () => {
  const props = emittedProperties();

  it('emits custom properties for every token group', () => {
    for (const group of ['color', 'space', 'radius', 'shadow', 'gradient', 'font', 'weight', 'duration']) {
      expect([...props.keys()].some((key) => key.startsWith(`--${group}-`)), group).toBe(true);
    }
  });

  it('keeps every custom property equal to its Sass variable', () => {
    const sass = sassValues([...props.keys()]);
    expect(sass.size).toBe(props.size);
    for (const [name, value] of props) {
      expect(value, name).toBe(sass.get(name));
    }
  });
});
