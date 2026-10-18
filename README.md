This is a [Next.js](https://nextjs.org) project bootstrapped with [`create-next-app`](https://nextjs.org/docs/app/api-reference/cli/create-next-app).

## Local setup

Use Node.js 24.15.0 (`.nvmrc`) and npm with the checked-in `package-lock.json`.

1. Run `npm ci`.
2. Copy `.env.example` to `.env` (PowerShell: `Copy-Item .env.example .env`; Linux: `cp .env.example .env`).
3. Start PostgreSQL through Laragon. Pin PostgreSQL major **18**: the running local binary reports 18.3.
4. Keep the existing development database `logistik_web`. Create the separate test database manually:

   ```sql
   CREATE DATABASE "logistik_web_test";
   ```

5. Validate and generate the client without changing either database:

   ```sh
   npx prisma validate
   npx prisma generate
   npm run check
   npm run build
   ```

6. Explicitly opt into the read-only test database smoke test:

   ```sh
   npm run test:integration
   ```

The CLI and integration tests load `.env`; existing process variables take precedence.
`TEST_DATABASE_URL` must name a PostgreSQL database containing `test` and must not target the development database.
Default `npm test` and `npm run check` run only database-free tests.
The smoke test runs only `SELECT 1`; it creates no tables or databases.
Generated Prisma files are ignored; rerun `npx prisma generate` after installation or schema changes.
Do not run migrations, introspection, or `db push` for this foundation-only schema.

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

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.
