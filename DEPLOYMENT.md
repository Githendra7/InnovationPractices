# Deployment Guide for Vercel

This guide outlines the steps to deploy the "Innovation Practices" application to Vercel.

## Prerequisites

1.  **Vercel Account**: [Sign up here](https://vercel.com/signup).
2.  **GitHub Repository**: Push your code to a GitHub repository.
3.  **Database**: A hosted PostgreSQL database (e.g., Supabase, Neon, or Vercel Postgres).

## Environment Variables

You need to configure the following environment variables in your Vercel project settings:

| Variable | Description |
| :--- | :--- |
| `GROQ_API_KEY` | Required for the main AI workflow generation. |
| `GOOGLE_API_KEY` | Required for RAG (Embeddings). Providing this is optional but recommended for full functionality. |
| `DATABASE_URL` | Connection string for your production PostgreSQL database. |

## Deployment Steps

### 1. Database Setup (Supabase Example)
Since the project uses Prisma with PostgreSQL, you need a live database.
1.  Create a new project on [Supabase](https://supabase.com/).
2.  Go to **Project Settings > Database**.
3.  Copy the **Connection String** (use the Transaction Pooler usually port 6543, or Session mode port 5432).
    *   *Note: For Prisma, you often need two URLs if using a pooler (Direct vs Pooled), but for this app, a standard session connection usually works fine for low traffic, or use the pooled URL.*

### 2. Connect to Vercel
1.  Log in to your Vercel Dashboard.
2.  Click **"Add New..."** -> **"Project"**.
3.  Import your GitHub repository `innovation-practices`.

### 3. Configure Project
1.  **Framework Preset**: Select **Next.js**.
2.  **Root Directory**: `./` (default).
3.  **Build Command**: `next build` (default).
    *   *Important*: Vercel will automatically run `prisma generate` during the build because it detects Prisma.
4.  **Environment Variables**: expand the section and add the keys listed above (`GROQ_API_KEY`, `GOOGLE_API_KEY`, `DATABASE_URL`).

### 4. Deploy
1.  Click **Deploy**.
2.  Wait for the build to complete.
3.  Once live, Vercel will provide a URL (e.g., `https://innovation-practices.vercel.app`).

## Post-Deployment

### Database Migration
After deployment, you must ensure your production database has the correct schema.
Vercel can sometimes run this automatically if configured in `package.json`, but the safest way is to run it manually from your local machine (pointing to production) or via the Vercel console.

**Option A: Run from Local Machine**
1.  Update your local `.env` file temporarily to point `DATABASE_URL` to your **production** database string.
2.  Run:
    ```bash
    npx prisma db push
    ```
3.  (Revert your local `.env` back to localhost after).

**Option B: Add a Build Command**
Modify your `package.json` build script to include migration (use with caution in production):
```json
"scripts": {
  "build": "npx prisma db push && next build"
}
```

## Troubleshooting

- **500 Error on API Calls**: Check Vercel Logs. It's usually a missing API Key.
- **Prisma Error**: Ensure `DATABASE_URL` is correct and accessible from Vercel (allow 0.0.0.0/0 on Supabase if needed).
