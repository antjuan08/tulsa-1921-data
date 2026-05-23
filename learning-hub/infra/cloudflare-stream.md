# Cloudflare Stream — Ops Notes

## Account setup

1. Enable Stream on your Cloudflare account: https://dash.cloudflare.com → Stream.
2. Create an API token with **Stream:Edit** permissions:
   - Dashboard → Profile → API Tokens → Create Token → Custom token.
   - Scope: Account → Stream → Edit.
   - Save as `CLOUDFLARE_STREAM_API_TOKEN`.
3. Generate a signing key for signed playback:
   ```bash
   curl -X POST \
     -H "Authorization: Bearer $CLOUDFLARE_STREAM_API_TOKEN" \
     https://api.cloudflare.com/client/v4/accounts/$CLOUDFLARE_ACCOUNT_ID/stream/keys
   ```
   Save the response's `id` as `CLOUDFLARE_STREAM_SIGNING_KEY_ID` and `pem` as
   `CLOUDFLARE_STREAM_SIGNING_KEY_PEM` (multiline OK).

## Upload flow

The web admin uses **Direct Creator Upload**: the server mints a one-time upload URL,
the admin's browser uploads the file directly to Cloudflare, and a webhook flips
the lesson's `status` from `processing` → `ready`.

```bash
# Server side, when admin clicks "Upload"
curl -X POST \
  -H "Authorization: Bearer $CLOUDFLARE_STREAM_API_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"maxDurationSeconds": 7200, "requireSignedURLs": true}' \
  https://api.cloudflare.com/client/v4/accounts/$CLOUDFLARE_ACCOUNT_ID/stream/direct_upload
```

The response includes `uploadURL` (browser PUTs the file there) and `uid` (store
on the `lessons` row immediately).

## Webhook

Register `https://<your-domain>/api/webhooks/cloudflare-stream` in the dashboard
or via API. Production should also verify the HMAC signature; see
`apps/web/src/app/api/webhooks/cloudflare-stream/route.ts` for the verification
TODO.

## Local development

Seeded lessons use Cloudflare's **public demo video UIDs** with unsigned playback,
so video plays out of the box without any of the env vars above. Set them only
when you're ready to upload your own content.
