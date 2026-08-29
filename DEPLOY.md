# Put your planner online (GitHub + Railway)

This guide assumes you have **zero** experience. Follow each step in order.

**What you’re doing in plain English:**
1. Put your project code on **GitHub** (like a folder in the cloud)
2. Tell **Railway** to read that folder and run it as a website
3. Railway gives you a link like `https://your-app.up.railway.app` — that’s your live planner

---

## Part 1 — Get the code on GitHub

### Step 1: Install tools (one time only)

Open **Terminal** on your Mac (search “Terminal” in Spotlight).

Paste these lines one at a time and press Enter after each:

```bash
# Install the Origin CLI (gets code from Cursor)
curl -fsSL https://downloads.cursor.com/origin/install.sh | sh

# Sign in
origin auth login
```

If it says `origin: command not found`, run this and try again:

```bash
echo 'export PATH="$HOME/.local/bin:$PATH"' >> ~/.zshrc
source ~/.zshrc
```

### Step 2: Download the project to your computer

```bash
cd ~
origin repo clone road-dog-supply-co/pdf-webify
cd pdf-webify
```

### Step 3: Create a new empty repo on GitHub

1. Go to [https://github.com/new](https://github.com/new)
2. **Repository name:** `planner-website` (or any name you like)
3. Leave it **Public** or **Private** — your choice
4. **Do NOT** check “Add a README” (leave the repo empty)
5. Click **Create repository**

GitHub will show you a page with commands. Keep that tab open.

### Step 4: Upload your project to GitHub

Back in Terminal (make sure you’re still in the `pdf-webify` folder):

Replace `YOUR_GITHUB_USERNAME` with your actual GitHub username:

```bash
git remote add github https://github.com/YOUR_GITHUB_USERNAME/planner-website.git
git push -u github main
```

If it asks you to log in, follow the prompts (GitHub may open your browser).

**Check it worked:** refresh your GitHub repo page — you should see folders like `app`, `components`, `public`.

> **Important:** The file `public/planner.pdf` is ~37 MB. GitHub allows this (limit is 100 MB per file). The first push may take a few minutes.

---

## Part 2 — Deploy on Railway

### Step 1: Log into Railway

Go to [https://railway.app](https://railway.app) and sign in (you can use “Login with GitHub”).

### Step 2: Create a new project

1. Click **New Project**
2. Choose **Deploy from GitHub repo**
3. If asked, **authorize Railway** to access your GitHub account
4. Select your repo: `planner-website` (or whatever you named it)

Railway will start building automatically. Wait 2–5 minutes.

### Step 3: Get your public website link

1. Click your project, then click the **service** (the box that appeared)
2. Open the **Settings** tab
3. Scroll to **Networking** → click **Generate Domain**
4. Railway gives you a URL like `planner-website-production.up.railway.app`

Open that URL in your browser — your planner should load.

### Step 4: Bookmark your personal planner link

Once the site is live:

1. Open your planner website
2. Click **My link** in the toolbar (copies your personal URL)
3. **Bookmark that link** in your browser (Safari: Bookmarks → Add Bookmark)

Your notes save to the cloud automatically. If your browser ever clears its data, open that bookmark and everything comes back — no JSON file needed.

> **Important for Railway:** Your notes are stored on the server in a `.data` folder. By default Railway may reset that folder when you redeploy. For long-term cloud saves, add a **Volume** in Railway (Settings → Volumes → mount at `/app/.data`). Ask in Cursor if you want help setting that up.

---

## Part 3 — When you make changes later

After you edit the planner on your computer:

```bash
cd ~/pdf-webify
git add .
git commit -m "Describe what you changed"
git push github main
```

Railway detects the push and **automatically redeploys** (usually within a few minutes).

---

## Troubleshooting

| Problem | What to try |
|--------|-------------|
| Push to GitHub fails | Make sure you replaced `YOUR_GITHUB_USERNAME` and created the empty repo first |
| Railway build fails | In Railway → your service → **Deployments** → click the failed deploy → read the red error log |
| Site loads but planner stuck on “Downloading…” | Wait up to 60 seconds (37 MB file). Try hard refresh: `Cmd+Shift+R` |
| “Application failed to respond” | In Railway → **Settings** → check that a domain was generated under Networking |

---

## Optional: use your own domain name

If you own a domain (e.g. `myplanner.com`):

1. Railway → your service → **Settings** → **Networking** → **Custom Domain**
2. Add your domain and follow Railway’s DNS instructions

---

## Costs

- **GitHub:** free for public/private repos at this size
- **Railway:** has a free trial / hobby tier with usage limits. Check [railway.app/pricing](https://railway.app/pricing). A personal planner with moderate traffic is usually inexpensive.

---

## Quick reference

| What | URL |
|------|-----|
| Your code on Cursor | [https://cursor.com/codebase/road-dog-supply-co/pdf-webify](https://cursor.com/codebase/road-dog-supply-co/pdf-webify) |
| Create GitHub repo | [https://github.com/new](https://github.com/new) |
| Railway dashboard | [https://railway.app/dashboard](https://railway.app/dashboard) |
