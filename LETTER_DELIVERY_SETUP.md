# Reader letter delivery

The form submits to `/api/letters`. Success means the email provider accepted the letter, not a guarantee of inbox arrival or a reply. Downloads and saved drafts remain optional local copies. No payment or purchase is involved.

Deploy from the repository root with `dist` as the output directory so Vercel also deploys the root `api` folder. Set these server-side environment variables in Vercel, then redeploy:

- `LETTER_TO_EMAIL`: the receiving inbox.
- `LETTER_FROM_EMAIL`: a sender address on a domain verified in Resend.
- `RESEND_API_KEY`: an API key allowed to send email.
- `LETTER_SITE_ORIGIN`: the exact public HTTPS origin, without a trailing slash.
- `TURNSTILE_SITE_KEY` and `TURNSTILE_SECRET_KEY`: Cloudflare Turnstile credentials configured for that website hostname.

Keep credentials out of Git and chat. Only the public Turnstile site key is returned to the browser. The route rejects foreign origins, invalid submissions and failed bot verification. Provider retry keys avoid duplicate sends for the same attempt. Letter contents are not written to application logs.

Without all configuration, delivery stays disabled and the visitor can save or download their letter. A failed send preserves the form. To verify live delivery after configuring, send a deliberate test letter, check the receiving inbox and Reply-To address, and verify a failed verification cannot send mail.

Run `node --test` for automated checks. Delivery tests use fake provider responses; they do not send real email. A static file server cannot execute the API; use a Vercel deployment for the complete flow.
