# Project Documentation for Claude

## Feature-Based Architecture

This project uses **feature-based directory structure**, not layered architecture.

```
src/features/
  ├── documents/
  │   ├── types.ts
  │   ├── hooks/
  │   ├── components/
  │   └── routes/
  └── [feature-name]/
      ├── types.ts
      ├── hooks/
      ├── components/
      └── routes/
```

Each feature contains all its related code: types, hooks, components, routes, utils, etc.

Shared/central utilities (like `supabase.ts`) go in `src/lib/`.

## Frontend

**Routing**: Use TanStack Router with file-based routing (not dot notation).

**UI Components**: Use shadcn/ui components.
- NEVER install `@radix-ui/*` packages directly
- ALWAYS use `bunx --bun shadcn@latest add <component>` instead

**Styling**: Use Tailwind CSS.

## Prompt Engineering Best Practice

When writing documentation:
- **Be concise** - Only document non-obvious decisions
- **Avoid redundancy** - Don't explain what code clearly shows
- **Focus on "why"** - Explain architectural choices, not syntax
- **Assume competence** - Claude knows standard practices
- **Update context** - Document deviations from conventions

What NOT to document:
- Standard TypeScript/React patterns
- Framework documentation (already known)
- Self-explanatory code
- Temporary implementations
