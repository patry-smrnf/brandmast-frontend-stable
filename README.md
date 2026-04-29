This is a [Next.js](https://nextjs.org) project bootstrapped with [`create-next-app`](https://nextjs.org/docs/app/api-reference/cli/create-next-app).

## Getting Started

First, run the development server:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

You can start editing the page by modifying `app/page.tsx`. The page auto-updates as you edit the file.

This project uses [`next/font`](https://nextjs.org/docs/app/building-your-application/optimizing/fonts) to automatically optimize and load [Geist](https://vercel.com/font), a new font family for Vercel.

## API (recommended structure)

This project includes a small API layer designed to be safe and universal across server + client components.

- **Client wrapper**: `app/lib/api/*`
- **Next.js backend proxy**: `app/api/_proxy/[...path]/route.ts`

### Configure backend URL

Create `.env.local` (or set env vars in your host) based on `.env.example`:

- `API_BASE_URL=http://localhost:8081`

### Usage in pages/components

Call your backend via the proxy:

```ts
import { brandmastApi, tokenStore } from "@/app/lib/api";

// login -> store JWT -> use it automatically in next calls
const login = await brandmastApi.login({ login: "demo", password: "secret" });
const token = login.data?.token;
if (token) tokenStore.set(token);

// Example: GET http://localhost:8081/api/shop/fetch through /api/_proxy/api/shop/fetch
const shops = await brandmastApi.fetchShops();
```

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.
