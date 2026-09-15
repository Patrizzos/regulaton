// lib/api-error.ts
// Extracts the real error message from a failed API response instead of
// discarding it for a generic "something went wrong" — this matters most for
// 402 responses (trial ended / payment failed / subscription cancelled),
// where the API already has a specific, actionable message that a generic
// alert would otherwise throw away.

export async function getErrorMessage(res: Response, fallback = "Something went wrong. Please try again."): Promise<string> {
  try {
    const body = await res.json();
    if (typeof body?.error === "string") return body.error;
  } catch {
    // response wasn't JSON — fall through to the generic message
  }
  return fallback;
}

export function isAccessError(res: Response): boolean {
  return res.status === 402;
}

// Shared handling for a failed mutation: surfaces the real API message
// (critically, the specific 402 reason — trial ended / payment failed /
// cancelled — rather than a generic "something went wrong"), and for 402
// specifically, sends the person straight to billing where they can fix it.
export async function handleMutationError(res: Response, router: { push: (href: string) => void }) {
  const message = await getErrorMessage(res);
  if (isAccessError(res)) {
    alert(message);
    router.push("/settings#billing");
  } else {
    alert(message);
  }
}
