// Access rules for the client portal's storage (/api/storage).
//
// Team members (signed in to the admin hub) can read and write every client.
// A client only ever knows their own access code: with it they can read their
// own record, minus internal notes, and change nothing but their onboarding.

const CODE = /^[A-Z0-9]{6,12}$/;
export const MAX_BYTES = 200_000;

export function clientCode(key) {
  if (typeof key !== "string" || !key.startsWith("client:")) return null;
  const code = key.slice(7);
  return CODE.test(code) ? code : null;
}

// What a client may see of their own record.
export function forClient(record) {
  if (!record || typeof record !== "object") return null;
  const { adminNotes, ...visible } = record;
  return visible;
}

// What a client may change: their onboarding answers, nothing else.
export function clientUpdate(existing, incoming) {
  if (!existing || !incoming || typeof incoming !== "object") return null;
  const next = { ...existing };
  if (incoming.onboarding && typeof incoming.onboarding === "object" && !Array.isArray(incoming.onboarding)) {
    next.onboarding = incoming.onboarding;
  }
  if (typeof incoming.onboardingComplete === "boolean") next.onboardingComplete = incoming.onboardingComplete;
  return next;
}

// Shape checks for what the team writes.
export function validTeamWrite(key, value) {
  if (key === "clients:index") {
    return Array.isArray(value) && value.every((c) => typeof c === "string" && CODE.test(c));
  }
  const code = clientCode(key);
  return Boolean(code && value && typeof value === "object" && !Array.isArray(value) && value.code === code);
}

export function tooBig(value) {
  return JSON.stringify(value ?? null).length > MAX_BYTES;
}
