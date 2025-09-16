import { SignJWT, jwtVerify } from 'jose';
const enc = new TextEncoder();
const key = (secret: string) =>
  crypto.subtle.importKey('raw', enc.encode(secret), { name: 'HMAC', hash: 'SHA-256' }, false, ['sign','verify']);

export async function signJwt(payload: object, secret: string, exp = '8h') {
  return new SignJWT(payload as any)
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime(exp)
    .sign(await key(secret));
}

export async function verifyJwt(token: string, secret: string) {
  const { payload } = await jwtVerify(token, await key(secret), { algorithms: ['HS256'] });
  return payload;
}
