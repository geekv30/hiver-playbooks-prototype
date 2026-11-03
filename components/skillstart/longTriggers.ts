// Fuller trigger conditions for the start-options review (/component/skill-start
// and its full-editor routes), so each layout is tried with a real, multi-line
// trigger. Review only: the seeded fixtures keep their short triggers.
export const LONG_TRIGGERS: Record<string, string> = {
  'refund-requests':
    'When a customer asks for a refund, a return, or their money back on an order placed in the last 30 days. Include emails about a damaged, missing, or wrong item. Do not use it for subscription cancellations, or for orders that a teammate already refunded.',
  'nps-followups':
    'When a customer gives an NPS score of 6 or lower, or writes a negative comment in the survey. Include replies to the survey email. Do not use it for scores from internal test accounts, or for a customer who already has an open complaint.',
};
