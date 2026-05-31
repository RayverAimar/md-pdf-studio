// Seed content so a fresh editor opens onto a styled page rather than a blank one. It exercises every
// element a theme can target — headings, links, lists, tables, blockquote, inline and fenced code —
// so changing any control shows an immediate effect in the preview.
export const SAMPLE_DOCUMENT = `# Quarterly Report

A visual Markdown editor where every style is a **control**, not a line of CSS.

## Highlights

- Live preview that matches the exported PDF
- Granular typography, color and spacing
- Bundled fonts and syntax themes

Read the [design notes](https://example.com) for the rationale.

### Code

\`\`\`typescript
export function greet(name: string): string {
  return \`Hello, \${name}\`;
}
\`\`\`

Inline like \`const x = 42\` stays readable too.

> Typography is the craft of endowing human language with a durable visual form.

| Metric | Q1 | Q2 |
| --- | --- | --- |
| Revenue | 1.2M | 1.8M |
| Growth | 12% | 50% |
`;
