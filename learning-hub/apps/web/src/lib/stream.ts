import 'server-only';
import { createSign, createPrivateKey } from 'crypto';

const accountId = process.env.CLOUDFLARE_ACCOUNT_ID;
const signingKeyId = process.env.CLOUDFLARE_STREAM_SIGNING_KEY_ID;
const signingKeyPem = process.env.CLOUDFLARE_STREAM_SIGNING_KEY_PEM;

export function hasStreamSigning(): boolean {
  return Boolean(accountId && signingKeyId && signingKeyPem);
}

// Cloudflare Stream signed URLs use a JWT signed with the account's private signing key.
// Docs: https://developers.cloudflare.com/stream/viewing-videos/securing-your-stream
export function signPlaybackToken(opts: {
  videoUid: string;
  userId: string;
  expiresInSeconds?: number;
}): { token: string; expiresAt: number } {
  if (!signingKeyId || !signingKeyPem) {
    throw new Error('Cloudflare Stream signing key not configured.');
  }
  const exp = Math.floor(Date.now() / 1000) + (opts.expiresInSeconds ?? 60 * 60 * 4);
  const header = base64url(JSON.stringify({ alg: 'RS256', kid: signingKeyId, typ: 'JWT' }));
  const payload = base64url(
    JSON.stringify({
      sub: opts.videoUid,
      kid: signingKeyId,
      exp,
      // Optional: bind to user so logs identify who watched.
      accessRules: [
        { type: 'any', action: 'allow' },
      ],
      userId: opts.userId,
    }),
  );
  const signingInput = `${header}.${payload}`;
  const key = createPrivateKey(signingKeyPem);
  const signer = createSign('RSA-SHA256');
  signer.update(signingInput);
  signer.end();
  const signature = signer.sign(key);
  const token = `${signingInput}.${base64urlBuffer(signature)}`;
  return { token, expiresAt: exp * 1000 };
}

// Public, unsigned playback works for videos with `requireSignedURLs=false`.
// Seeded demo videos use this path so the dev environment works without keys.
export function publicPlaybackUrl(videoUid: string): string {
  return `https://customer-${accountId ?? 'demo'}.cloudflarestream.com/${videoUid}/manifest/video.m3u8`;
}

export function iframeEmbedUrl(videoUid: string, opts?: { signedToken?: string }): string {
  const id = opts?.signedToken ?? videoUid;
  return `https://iframe.videodelivery.net/${id}`;
}

function base64url(input: string): string {
  return Buffer.from(input).toString('base64').replace(/=/g, '').replace(/\+/g, '-').replace(/\//g, '_');
}

function base64urlBuffer(buf: Buffer): string {
  return buf.toString('base64').replace(/=/g, '').replace(/\+/g, '-').replace(/\//g, '_');
}
