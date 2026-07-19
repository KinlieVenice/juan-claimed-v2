// Simulates network latency so components already handle loading states —
// swap the mock service bodies for real fetch calls later, this stays or goes either way.
export function delay(ms = 250): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}
