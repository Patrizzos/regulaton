// lib/normalize.ts
// Small shared normalization helpers, so identity-bearing fields (like an
// email used as a grouping/uniqueness key) are handled consistently
// everywhere they're written, rather than trusting every call site to
// remember to trim/lowercase.

export function normalizeEmail(email: string): string {
  return email.trim().toLowerCase();
}
