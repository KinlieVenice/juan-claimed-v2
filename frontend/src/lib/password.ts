// Client-side suggested-password generator for the Create User form — the plaintext is
// already known to the client either way (it's typed straight into the create request),
// so this doesn't need to match the backend's reset-password generator exactly, just the
// same "excludes ambiguous characters" spirit.
const PASSWORD_CHARS = "ABCDEFGHJKMNPQRSTUVWXYZabcdefghjkmnpqrstuvwxyz23456789";

export function generatePassword(length = 8): string {
  let password = "";
  for (let i = 0; i < length; i++) {
    password += PASSWORD_CHARS[Math.floor(Math.random() * PASSWORD_CHARS.length)];
  }
  return password;
}
