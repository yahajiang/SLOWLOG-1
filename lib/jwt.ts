import { SignJWT, jwtVerify } from "jose";

// Secret for JWT - in production, use environment variable
const JWT_SECRET = new TextEncoder().encode(
  process.env.JWT_SECRET || "slowlog-secret-key-change-in-production-2024"
);

export interface SessionPayload {
  username: string;
  name: string;
  isDefault?: boolean;
}

// Create JWT token
export async function createToken(payload: SessionPayload): Promise<string> {
  return new SignJWT({
    username: payload.username,
    name: payload.name,
    isDefault: payload.isDefault,
  })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime("7d")
    .sign(JWT_SECRET);
}

// Verify JWT token
export async function verifyToken(token: string): Promise<SessionPayload | null> {
  try {
    const { payload } = await jwtVerify(token, JWT_SECRET);
    return payload as unknown as SessionPayload;
  } catch {
    return null;
  }
}
