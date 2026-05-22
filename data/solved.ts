// Mock outputs per chip type. Populated as Task 28 (Output surface) needs them.
// For v1, the Output tab can render "No output yet" for any chip whose
// actionId isn't in this map.

export const SOLVED: Record<string, unknown> = {
  // Add chip-output mocks here when Task 28 lands.
  // Example shape:
  //   'shopify_get_order': { orderId: '#1042', total: 1280.00, customer: 'rhys@walkjapan.com' }
};

export function solvedFor(actionId: string): unknown {
  return SOLVED[actionId] ?? null;
}
