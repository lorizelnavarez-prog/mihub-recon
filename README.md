# MIHub Recon

MCR report reconciliation against Google Ads data. Upload an MCR `.xlsx`, the app
auto-detects the date range, OP number, PL codes, and all report sections. Later
phases compare against Google Ads and flag discrepancies over 5%.

## Status
- Phase 1: Next.js scaffold, Vercel-ready. Done.
- Phase 2: MCR upload + parser (metadata + sections). Done, tested on the Lenovo Aura sample.
- Phase 3+: Google Ads API pull, discrepancy engine, enrichment, export. Pending.

## Run locally (VS Code)
1. Open this folder in VS Code.
2. In the terminal:
   ```bash
   npm install
   npm run dev
   ```
3. Open http://localhost:3000 and drop an MCR `.xlsx` on the page.

## Deploy to Vercel (free)
1. Push this folder to a GitHub repo.
2. In Vercel, "Add New Project" and import the repo. Framework auto-detects as Next.js.
3. In Project Settings, enable **Fluid compute** (Settings > Functions). This raises the
   Hobby function timeout to 300s, which the Google Ads pull in a later phase will need.
4. Every `git push` auto-deploys.

Note: Vercel Hobby is personal / non-commercial per their terms. For an internal
company tool, either accept that gray area or use Netlify free (allows commercial use).

## Structure
- `app/page.jsx` - upload UI + parsed summary
- `app/api/parse/route.js` - server-side parse endpoint
- `lib/parseMCR.js` - the MCR parser (tested against the sample)

## Input contract (locked from sample)
- Sheet: `Overall performance` (falls back to first sheet)
- Metadata rows: `Report Name:` (contains `OP\d+` and `ID: \d+`), `Date Range:` (`dd-Mon-yyyy - dd-Mon-yyyy`)
- Sections: header row + data rows, separated by blank rows. Leading empty column A.
- PL codes read from the Placement section rows.
