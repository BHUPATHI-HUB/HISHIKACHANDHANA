# hishikachandhan · Hishika’s Poetry Journal

A responsive, buildless poetry website inspired by the supplied reference https://hishika.netlify.app/. All fonts and visual assets are served locally. No dependency installation or build is needed.

## Reference analysis

The reference introduces poet Hishika Chandan and the debut poetry collection **Us, Unscripted**. Its scrapbook style uses handwritten type, blush and blue paper, flowers, taped notes and an illustrated cover. The navigation leads to a bookshelf, December 2026 teaser, sample reader notes and a letterbox. Book details list 141 paperback pages, Writer’s Pocket, publication on 21 September 2026 and a reading age of 15+. The Amazon product destination is `https://www.amazon.in/dp/9379034296`.

The source configuration declares preview mode. It contains no newsletter or letterbox endpoint, signed-copy order URL, or social-profile URLs. The user subsequently supplied Instagram, Substack, Amazon, Flipkart, and Google Play Books URLs; those are now connected through floral notes and keepsake tickets. Reader notes are samples. The actual cover JPG returns 404 and the original renders an SVG placeholder. December’s exact release date, title and final cover are unannounced. This recreation preserves those distinctions; it does not assert that the author commissioned or approved the design.

## Design and interactions

- Cream paper, rose ink, local Lora and Caveat fonts; original ribbon and floral SVG compositions.
- Responsive scrapbook hero, detailed bookshelf, back-cover line, upcoming release, clearly illustrative reader wall, and a paper letterbox.
- Slow ribbon motion, floral wish bursts, gentle scroll reveals, animated book and envelope details. A visible pause control and system reduced-motion support are included.
- A 6.2-second floral opening plays on entry and reload: the actual header name moves to the centre (1.3s), rests (0.5s), flowers gradually bloom (2.5s), then the name returns and the page appears (1.9s). Scrolling and underlying controls are locked until completion. Skip, resize, back-cache restoration, missing animation support and a bounded loading fallback all restore the page and the one original logo. Reduced motion or saved pause uses a simple 0.4-second opacity fade. The footer refresh button and same-tab page navigation use a 0.3-second closing transition; new-tab links and downloads keep their normal behaviour. Native tab closing and browser refresh cannot reliably play an exit animation.
- Small hearts, flowers, sparkles and bows bloom at a tap or click without intercepting input. Dragging/scrolling does not trigger them, and the number of live particles is capped. Smooth anchor scrolling and soft scroll reveals preserve native scrolling.
- Dialogs fade closed with their backdrops; Escape, backdrop clicks and close buttons all restore focus. Pausing motion or enabling reduced motion skips these effects immediately.
- Morning/evening themes, local quote bookmark, native accessible excerpt/signed-copy dialogs with Escape and focus return.
- Letter type, message counter, validation, optional name, explicit local draft saving and plain-text download. Letters are never sent.
- Downloadable calendar reminder to **check for news on 1 December**, explicitly not a confirmed launch date.
- Signed dedication note download; no invented checkout or contact links.
- The five supplied social/bookstore links open in new tabs. Their paper notes and tickets gently lift and bloom on hover, keyboard focus, or tap; motion preferences remain respected.

- Current-section navigation, a discreet reading-progress line, larger mobile tap targets and text, pointer-only hover feedback, and visible unsaved-draft status.
- Native sharing with clean URLs where supported; an accessible copy-link dialog and manual-copy fallback otherwise.

## Delivery boundaries

This is a complete design preview. Connecting actual letter delivery, a newsletter, signed ordering and the remaining Goodreads profile requires the author’s chosen endpoints and URLs. Visitor email addresses are not collected. Drafts are kept only when the visitor explicitly saves them on their device. All social and bookstore links open with `noopener noreferrer`.

## Files

`dist/index.html`, `dist/styles.css`, `dist/app.js`, `dist/transitions.js`, `dist/intro.js`, `dist/enhancements.js`, `dist/assets/` are the static site. `vercel.json` selects a static deployment and serves the `dist` directory. No build step is needed. SVG cover and font assets came from the reference’s publicly served assets; obtain the author's final cover before a commercial launch.

## Verification

JavaScript syntax, local assets, fragment destinations, and deployment packaging are checked before publishing. Transition logic checks cover opening/reload timing, dialog closing, reduced motion, pause/resume, taps versus scrolling, particle limits/cleanup, and back-cache recovery. Run `node --test` from the repository root to repeat the dependency-free checks in `tests/`. They cover the intro lifecycle, sharing and drafts, navigation, motion controls, and the exact supplied links with safe new-tab behaviour. These are logic/structure checks. Browser visual QA could not run because the cloud browser cannot reach the local preview server.

## GitHub and Vercel deployment

Import this repository into Vercel with project name `hishikachandhan` and production branch `main`. Keep the root directory at the repository root. `vercel.json` sets framework Other, skips installation/build, and serves `dist`. Connecting Vercel’s GitHub integration allows future pushes to deploy automatically.

## Pending material

[TASKS.md](TASKS.md) records the photographs, approved author/book content, genuine reviews, contact destinations, social URLs, and final deployment/share-card details to add when the user supplies them.
