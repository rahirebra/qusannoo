# Qusannoo — GitHub-only path to the Play Store

This folder is a proper PWA (`index.html` + `style.css` + `app.js` + `manifest.json` +
`service-worker.js`). Everything below can be done from github.com in your phone
browser — no Termux, no Android Studio.

## Step 1 — Create the repo and upload these files
1. On github.com, create a new **public** repository, e.g. `qusannoo`.
2. "Add file → Upload files" → upload every file in this folder, keeping the
   folder structure (`icons/`, `.github/workflows/`, `.well-known/`).

## Step 2 — Turn on GitHub Pages (this hosts your app)
1. Repo → **Settings → Pages**.
2. Source: "Deploy from a branch" → Branch: `main`, folder `/ (root)` → Save.
3. Wait ~1 minute, then note your live URL, e.g.
   `https://yourusername.github.io/qusannoo`.
4. Open it — you should see the working app in your mobile browser.

## Step 3 — Tell the workflows your Pages URL
1. Repo → **Settings → Secrets and variables → Actions → Variables tab → New repository variable**.
2. Name: `PWA_URL`, Value: your Pages URL from Step 2 (no trailing slash).

## Step 4 — Generate your signing keystore (one time only)
1. Repo → **Actions** tab → "1 - Generate signing keystore" → **Run workflow**.
2. When it finishes, open the run → download the `keystore` artifact (a zip).
3. Inside you'll find:
   - `qusannoo-release.keystore.b64` — open it, copy the whole text.
   - `password.txt` — the random password that was generated.
4. Repo → **Settings → Secrets and variables → Actions → Secrets tab** → add:
   - `ANDROID_KEYSTORE_BASE64` = the contents of the `.b64` file
   - `KEYSTORE_PASSWORD` = the password from `password.txt`
   - `KEY_PASSWORD` = same password again
5. **Save `qusannoo-release.keystore` and the password somewhere safe outside
   GitHub too** (e.g. your Google Drive). If you ever lose it, you can never
   publish an update to this app listing again — Google will reject it.
6. In that same run's log, open the "Show SHA-256 fingerprint" step and copy
   the `SHA256:` value.

## Step 5 — Verify your domain owns the app (Digital Asset Links)
1. Edit `.well-known/assetlinks.json` in the repo (web editor is fine).
2. Replace `REPLACE_WITH_SHA256_FINGERPRINT_FROM_WORKFLOW_1_LOGS` with the
   fingerprint from Step 4.6 (keep the same format, colons included).
3. Commit. GitHub Pages will redeploy automatically.

## Step 6 — Build the signed AAB
1. Repo → **Actions** → "2 - Build signed AAB for Play Store" → **Run workflow**.
2. This step wraps your live PWA URL in a minimal Android shell (a Trusted
   Web Activity) and signs it with your keystore — all on GitHub's servers.
3. When it finishes, download the `qusannoo-release-aab` artifact — that's
   your `app-release-signed.aab`.

> Note: Bubblewrap's `init` step normally asks a few interactive questions
> (package name, app name, colors). The workflow tries to answer with
> sensible defaults pulled from your manifest. If the run fails at the
> `Initialize TWA project` step, open the log — it'll tell you which
> question it was stuck on, and I can adjust the workflow to answer it
> directly. This is the one step most likely to need a small tweak the
> first time.

## Step 7 — Submit to Play Console
1. Open Play Console in your phone browser (you've already paid the $25 fee
   and passed identity verification).
2. Create app → fill in title/description/screenshots/icon → upload the
   `.aab` from Step 6 → complete content rating, data safety form (this app
   stores everything locally, nothing leaves the device), and privacy
   policy URL → submit for review.

## Updating the app later
Edit files in GitHub → commit → re-run workflow 2 → download the new `.aab`
→ upload it as a new release in Play Console. The keystore secrets stay the
same forever, so every future build stays valid.
