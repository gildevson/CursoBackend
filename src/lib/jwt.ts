import { SignJWT, jwtVerify } from "jose";

// segredo em bytes (HMAC HS256)
function secretBytes(secret: string) {
  return new TextEncoder().encode(secret);
}

export async function signJwt(payload: Record<string, unknown>, secret: string, expiresIn = "15m") {
  const [amount, unit] = [parseInt(expiresIn), expiresIn.replace(/\d+/g, "") as "m"|"h"|"s"|"d"];
  const expMap = { s: "seconds", m: "minutes", h: "hours", d: "days" } as const;
  const jwt = await new SignJWT(payload)
    .setProtectedHeader({ alg: "HS256", typ: "JWT" })
    .setIssuedAt()
    .setExpirationTime({ [expMap[unit] || "minutes"]: isNaN(amount) ? 15 : amount } as any)
    .sign(secretBytes(secret));
  return jwt;
}

export async function verifyJwt<T>(token: string, secret: string): Promise<T> {
  const { payload } = await jwtVerify(token, secretBytes(secret));
  return payload as T;
}
