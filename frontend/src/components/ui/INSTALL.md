# Dependencies to install

Run this in your project root:

```bash
npm install clsx tailwind-merge
```

## Why

| Package | Used by |
|---|---|
| `clsx` | Conditional class joining in `cn()` |
| `tailwind-merge` | Resolves Tailwind class conflicts in `cn()` |

These two are the standard combo for component libraries built on Tailwind.
They're already assumed in the `package.json` devDependencies if you're
following the Tailwind + React + TypeScript stack.
