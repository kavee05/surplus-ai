# What you still need to do

Everything below needs your accounts or your decisions, so it was not done for you.

## 1. Public GitHub repository
1. Create an empty public repository on GitHub, for example `surplus-ai`. Do not add a README or licence there; they already exist here.
2. In this folder, run:
   ```bash
   git remote add origin https://github.com/YOUR-USERNAME/surplus-ai.git
   git branch -M main
   git push -u origin main
   ```
3. Check that `.env.local` is not in the repository (it is ignored by `.gitignore`).

## 2. Deploy to Vercel (project name "surplus-ai")
1. Sign in at vercel.com with GitHub.
2. Add New, Project, import the `surplus-ai` repository.
3. Set the project name to `surplus-ai`. Framework preset: Next.js (detected automatically). Leave build and output settings at their defaults.
4. Environment variables:
   - Leave them empty to run in demo mode. This is the recommended setting for the public link.
   - Optional: `NEXT_PUBLIC_SITE_URL` = your final URL, for example `https://surplus-ai.vercel.app`.
   - Only if you want live photo analysis: `LIVE_AI=true`, `GEMINI_API_KEY=...`, and optionally `GEMINI_MODEL`. Live mode costs you API credit; it is rate-limited to 8 analyses per visitor IP per 10 minutes per server instance.
5. Click Deploy. When it finishes, open the URL, click Try the guided demo and run it to the end.

## 3. Video
- Record the 5-minute walkthrough in `DEMO_SCRIPT.md`. Radar is on screen in the first minute.
- Record at 1280 × 800 or larger with browser zoom at 100%. Reset the demo data first.

## 4. Before submitting
- Add team names and roles to slide 10 in `PITCH_NOTES.md`.
- Format the evidence references in APA 7th (sources and links are on the Evidence page and in `src/data/evidence.ts`).
- Check the Persimmon source link: the brief gave only the publication and month (The Construction Index, January 2026), so the app links to the site's home page. Replace it with the article URL if you have it.
- Confirm the SDP figures (69% diversion, 31,288 t in FY2025, 27 active townships) against the AGM presentation and Sustainability Report you have.

## 5. Submission form
- Public repository URL.
- Vercel URL.
- Video link.
- Any written answers, using `PITCH_NOTES.md` as the source. Keep the honesty points: simulated data, not validated with SDP, not affiliated with SDP.
