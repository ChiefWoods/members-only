import { randomBytes, scryptSync, timingSafeEqual } from "node:crypto";

const KEY_SIZE = 64;

export function hashSecret(value: string): string {
  const salt = randomBytes(16).toString("hex");
  const hash = scryptSync(value, salt, KEY_SIZE).toString("hex");
  return `${salt}:${hash}`;
}

export function verifySecret(value: string, storedHash: string): boolean {
  const [salt, hashHex] = storedHash.split(":");
  if (!salt || !hashHex) {
    return false;
  }

  const valueHash = scryptSync(value, salt, KEY_SIZE);
  const stored = Buffer.from(hashHex, "hex");

  if (valueHash.length !== stored.length) {
    return false;
  }

  return timingSafeEqual(valueHash, stored);
}

export function safeEqualText(a: string, b: string): boolean {
  const aBuffer = Buffer.from(a);
  const bBuffer = Buffer.from(b);
  if (aBuffer.length !== bBuffer.length) {
    return false;
  }
  return timingSafeEqual(aBuffer, bBuffer);
}
