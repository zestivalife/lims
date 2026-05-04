# Frontend Deployment on Vercel (Step-by-Step)

This guide deploys only the `frontend` app first.

## Prerequisites
- GitHub account
- Vercel account
- Backend URL from Railway (or temporary API URL)

## 1) Push project to GitHub
1. Create a GitHub repo (private recommended).
2. Upload `lims-project` folder.

## 2) Create Vercel Project
1. Login to [Vercel](https://vercel.com/).
2. Click **Add New -> Project**.
3. Import your GitHub repo.
4. In **Root Directory**, select: `frontend`.
5. Framework should auto-detect as **Next.js**.

## 3) Set Environment Variables in Vercel
In Project -> Settings -> Environment Variables, add:
- `NEXT_PUBLIC_API_URL` = `https://your-railway-backend.up.railway.app`
- `NEXT_PUBLIC_SOCKET_URL` = `https://your-railway-backend.up.railway.app`

Use the same values for Production/Preview/Development (or environment-specific URLs if available).

## 4) Deploy
Click **Deploy**.

After deploy, open your Vercel URL:
- `https://your-app-name.vercel.app`

## 5) Validate frontend connectivity
- Login page should load.
- On login attempt, API calls should hit Railway backend.
- Browser DevTools -> Network should show requests to `NEXT_PUBLIC_API_URL`.

## 6) If CORS error appears
Update backend CORS origin allow-list to include:
- `https://your-app-name.vercel.app`
- custom domain (if used)

## 7) Custom domain (optional)
1. Vercel Project -> Settings -> Domains.
2. Add your domain/subdomain.
3. Update DNS as instructed.

## 8) Redeploy after backend URL changes
If Railway backend URL changes, update Vercel env vars and click:
- Deployments -> Redeploy latest.

