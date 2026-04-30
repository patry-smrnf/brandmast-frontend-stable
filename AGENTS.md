<!-- BEGIN:nextjs-agent-rules -->
# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` before writing any code. Heed deprecation notices.
<!-- END:nextjs-agent-rules -->

## Project conventions (Brandmast)

- **Routes only** in `app/(routes)/*` (pages, layouts, route-level components).
- **Backend proxy** lives in `app/api/*`.
- **App bootstrapping/providers** in `app/providers/*`.
- **Shared libraries** in `lib/*` (e.g. `lib/api`, `lib/config`).
- **Shared UI components** in `components/*` (e.g. `components/ui`).
