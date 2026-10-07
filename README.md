# hishikachandhan · Hishika’s Poetry Journal

A responsive, buildless poetry website inspired by the supplied reference https://hishika.netlify.app/. All fonts and visual assets are served locally. No dependency installation or build is needed.

## Reference analysis

The reference introduces poet Hishika Chandan and the debut poetry collection **Us, Unscripted**. Its scrapbook style uses handwritten type, blush and blue paper, flowers, taped notes and an illustrated cover. The navigation leads to a bookshelf, December 2026 teaser, sample reader notes and a letterbox. Book details list 141 paperback pages, Writer’s Pocket, publication on 21 September 2026 and a reading age of 15+. The Amazon product destination is `https://www.amazon.in/dp/9379034296`.

The source configuration declares preview mode. It contains no newsletter or letterbox endpoint, signed-copy order URL, or social-profile URLs. Reader notes are samples. The actual cover JPG returns 404 and the original renders an SVG placeholder. December’s exact release date, title and final cover are unannounced. This recreation preserves those distinctions; it does not assert that the author commissioned or approved the design.

## Design and interactions

- Cream paper, rose ink, local Lora and Caveat fonts; original ribbon and floral SVG compositions.
- Responsive scrapbook hero, detailed bookshelf, back-cover line, upcoming release, clearly illustrative reader wall, and a paper letterbox.
- Slow ribbon motion, floral wish bursts, gentle scroll reveals, animated book and envelope details. A visible pause control and system reduced-motion support are included.
- Morning/evening themes, local quote bookmark, native accessible excerpt/signed-copy dialogs with Escape and focus return.
- Letter type, message counter, validation, optional name, explicit local draft saving and plain-text download. Letters are never sent.
- Downloadable calendar reminder to **check for news on 1 December**, explicitly not a confirmed launch date.
- Signed dedication note download; no invented checkout or contact links.

## Delivery boundaries

This is a complete design preview. Connecting actual letter delivery, a newsletter, signed ordering and social profiles requires the author’s chosen endpoints and profile URLs. Visitor email addresses are not collected. Drafts are kept only when the visitor explicitly saves them on their device. External Amazon links open with `noopener noreferrer`.

## Files

`dist/index.html`, `dist/styles.css`, `dist/app.js`, `dist/assets/` are the static site. `vercel.json` selects a static deployment and serves the `dist` directory. No build step is needed. SVG cover and font assets came from the reference’s publicly served assets; obtain the author's final cover before a commercial launch.

## Verification

JavaScript syntax, HTML structure, local assets, fragment destinations, SVG XML, and deployment packaging are checked before publishing. Browser visual/runtime QA is unavailable in this environment because the required managed Sites browser skill is not installed.

## GitHub and Vercel deployment

Import this repository into Vercel with project name `hishikachandhan` and production branch `main`. Keep the root directory at the repository root. `vercel.json` sets framework Other, skips installation/build, and serves `dist`. Connecting Vercel’s GitHub integration allows future pushes to deploy automatically.
