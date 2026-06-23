# Publishing the Chess Game to GitHub Pages

This guide takes the project from its current state to a **live, playable URL** at:

> **https://ifahimkhan.github.io/ChessGame/**

The repo already exists at `https://github.com/ifahimkhan/ChessGame`, so we
only need to (1) clean up what's tracked, and (2) turn on GitHub Pages with an
automated build. Run the commands from the project root in Git Bash / a terminal.

---

## Why GitHub Pages?

This is a **static frontend** (Vite + Three.js, no backend). `npm run build`
produces a plain `dist/` folder of HTML/JS/CSS that any static host can serve.
`vite.config.js` already sets `base: './'`, which makes asset paths relative — so
the app works correctly when served from the `/ChessGame/` sub-path Pages uses.
No config change needed.

---

## Step 1 — Stop tracking build output and dependencies

Right now `node_modules/`, `dist/`, and `.claude/` are committed to the repo.
They shouldn't be: `node_modules` is huge and reinstallable, `dist` is rebuilt by
CI, and `.claude` is local tooling. A `.gitignore` has been added — now remove
those paths from Git's index (this does **not** delete the local folders):

```bash
git rm -r --cached node_modules dist .claude
```

> If a path was not actually tracked, Git prints a "did not match any files"
> warning — that's harmless, just drop that path from the command.

---

## Step 2 — Commit the cleanup and deploy workflow

Two new files were added for you:
- `.gitignore` — keeps junk out of the repo
- `.github/workflows/deploy.yml` — builds and deploys to Pages automatically

Commit everything and push:

```bash
git add .gitignore .github/workflows/deploy.yml
git add -A
git commit -m "chore: add gitignore + GitHub Pages deploy workflow"
git push origin main
```

---

## Step 3 — Enable GitHub Pages (one-time)

1. Open the repo on GitHub: <https://github.com/ifahimkhan/ChessGame>
2. Go to **Settings** → **Pages** (left sidebar).
3. Under **Build and deployment** → **Source**, choose **GitHub Actions**.
   - (Do **not** pick "Deploy from a branch" — the workflow handles it.)
4. That's it. No save button needed; the choice is stored immediately.

---

## Step 4 — Run the deploy

The push from Step 2 already triggered the workflow. To watch it:

1. Open the **Actions** tab on the repo.
2. Click the latest **"Deploy to GitHub Pages"** run.
3. Wait for both jobs (`build`, then `deploy`) to go green (~1–2 min).
4. The `deploy` job shows the live URL, or visit:

   **https://ifahimkhan.github.io/ChessGame/**

> First deploy can take a couple of minutes to become reachable. If you opened
> the URL too early and saw a 404, wait and refresh.

You can also re-run the deploy any time from **Actions** → the workflow →
**Run workflow** (this is the `workflow_dispatch` trigger).

---

## Updating the app later

Every push to `main` rebuilds and redeploys automatically:

```bash
git add -A
git commit -m "describe your change"
git push origin main
```

Then watch the **Actions** tab; the site updates when it goes green.

---

## Adding screenshots / video to the README

The [README.md](README.md) references images in `docs/`. To make them show up:

1. Save images as `docs/screenshot-1.png`, `docs/screenshot-2.png`.
2. For a video: drag-drop an `.mp4` into a GitHub issue or PR comment, copy the
   `https://user-images.githubusercontent.com/...` URL it generates, and paste
   it into the README's video section. (GitHub renders that inline; committing a
   raw `.mp4` and linking it does **not** play inline.)
3. Commit and push — the README on the repo home page updates.

---

## Troubleshooting

| Symptom | Cause / Fix |
|---------|-------------|
| **Blank page**, console 404s for `/assets/...` | Asset path issue. Confirm `vite.config.js` has `base: './'` (it does). Hard-refresh (Ctrl+Shift+R). |
| **404 page** right after first deploy | Pages not finished provisioning. Wait 1–2 min, refresh. |
| Workflow fails at **`npm ci`** | `package-lock.json` out of sync. Run `npm install` locally, commit the updated lockfile, push. |
| Actions tab shows **no runs** | Pages source not set to "GitHub Actions" (Step 3), or push didn't reach `main`. |
| Pages **Source** has no "GitHub Actions" option | Repo must be public, or you need GitHub Pages enabled for private repos (Pro). |
| WebGL / AI worker fails on the live site | Must be served over **https** (Pages is) — `file://` won't run ES module workers. |

---

## Alternative hosts (optional)

The same `dist/` build deploys anywhere. If you ever want a custom domain or
preview deploys:

- **Netlify** — "Add new site" → connect repo → build command `npm run build`,
  publish directory `dist`.
- **Vercel** — import the repo; it auto-detects Vite. Set output dir `dist`.
- **Cloudflare Pages** — build command `npm run build`, output `dist`.

For these, you can set `base: '/'` in `vite.config.js` (they serve from the
domain root), but `base: './'` works on all of them too.
