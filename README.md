# Purple Journal

A private-first personal journal built with Next.js, Markdown, and a
purple editorial design system.

## Features

- Public journal index and Markdown entry pages
- Server-enforced private entries that return 404 on public routes
- Password-protected admin editor
- Backdated publishing, privacy toggles, editing, and deletion
- Dark-first theme with an optional light mode
- Cloudflare D1 storage for Sites deployments
- Supabase-ready PostgreSQL schema and RLS policy in `schema.sql`

## Local development

Copy `.env.example` to `.env.local`, set `ADMIN_PASSWORD`, then run:

```bash
npm install
npm run dev
```

Without a local environment file, development mode uses `journal-preview`.

## Supabase

Run `schema.sql` in the Supabase SQL editor. Public reads are limited to rows
where `is_private = false`; private reads and all admin writes must use the
service-role key exclusively in server-side code.
