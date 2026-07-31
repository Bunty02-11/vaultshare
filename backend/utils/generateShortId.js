import { randomBytes } from "crypto";

export default function generateShortId(length = 7) {
  return randomBytes(8).toString("base64url").slice(0, length);
}
