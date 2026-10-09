// How a skill starts - the model behind the three directions on
// /component/skill-start. A skill can start on its own (Hiver AI finds a
// conversation that fits its trigger) or by hand (an agent or admin types
// /skill-name in Copilot, anywhere in Hiver). Each direction answers the same
// three questions differently:
//   1. how many choices the author gets,
//   2. what / does on a conversation that does not fit,
//   3. where / works (and for whom).
// Matching is scripted here: each email names the one skill it fits.

export type Direction = 'a' | 'b' | 'c';

/** Direction C scopes / by people, separately from mailboxes. */
export type Reach = 'everyone' | 'billing' | 'me';

export interface StartConfig {
  /** Starts on its own when a conversation in its mailboxes fits the trigger. */
  auto: boolean;
  /** Listed in Copilot's / menu. */
  slash: boolean;
  /** Direction C only: who sees it in the / menu. */
  reach: Reach;
}

export const DEFAULT_START: Record<Direction, StartConfig> = {
  a: { auto: true, slash: true, reach: 'everyone' },
  b: { auto: true, slash: true, reach: 'everyone' },
  c: { auto: true, slash: true, reach: 'everyone' },
};

/** Direction B's one choice, mapped onto the two switches. */
export type Choice = 'auto' | 'both' | 'slash';
export function choiceOf(c: StartConfig): Choice {
  if (c.auto && c.slash) return 'both';
  return c.slash ? 'slash' : 'auto';
}
export function fromChoice(choice: Choice, prev: StartConfig): StartConfig {
  return { ...prev, auto: choice !== 'slash', slash: choice !== 'auto' };
}

export const REACH_LABEL: Record<Reach, string> = {
  everyone: 'Everyone',
  billing: 'Billing team',
  me: 'Only me',
};

// --- Skills -----------------------------------------------------------------

export interface Skill {
  id: string;
  name: string;
  slug: string;
  trigger: string;
  mailboxes: string[];
  start: StartConfig;
}

/** The skill open in the editor. Its trigger and start settings are live. */
export const EDITED_ID = 'refund-requests';
export const EDITED_NAME = 'Refund requests';
export const EDITED_SLUG = 'refund-requests';
export const EDITED_TRIGGER = 'When a customer asks for a refund on an order placed in the last 30 days.';
export const EDITED_MAILBOXES = ['billing', 'refunds'];
export const EDITED_STEPS = [
  'Find the order in Shopify using the order number in the email.',
  'If it was placed in the last 30 days, issue the refund to the original payment method.',
  'If it is older, tag it Refund review and assign it to the Billing team.',
  'Draft a reply that says what happened and when the money will arrive.',
];

/** The rest of the workspace's skills, fixed, so the / menu reads like a real one. */
export const OTHER_SKILLS: Skill[] = [
  {
    id: 'api-error-triage',
    name: 'API error triage',
    slug: 'api-error-triage',
    trigger: 'When a customer reports an API error or a problem with the API.',
    mailboxes: ['support'],
    start: { auto: true, slash: true, reach: 'everyone' },
  },
  {
    id: 'order-status',
    name: 'Order status lookup',
    slug: 'order-status',
    trigger: 'When someone asks where their order is or when it will arrive.',
    mailboxes: ['support', 'billing'],
    start: { auto: false, slash: true, reach: 'everyone' },
  },
  {
    // On its own only: never in the / menu, in any direction.
    id: 'contract-renewals',
    name: 'Contract renewal reminders',
    slug: 'contract-renewals',
    trigger: 'When a contract is 30 days from renewal.',
    mailboxes: ['sales'],
    start: { auto: true, slash: false, reach: 'everyone' },
  },
];

// --- People + places ----------------------------------------------------------

export interface Person {
  id: 'maya' | 'sam';
  name: string;
  team: 'Billing' | 'Support';
}
export const PEOPLE: Person[] = [
  { id: 'maya', name: 'Maya Patel', team: 'Billing' },
  { id: 'sam', name: 'Sam Okafor', team: 'Support' },
];
/** Maya wrote Refund requests - "Only me" means her. */
export const AUTHOR_ID: Person['id'] = 'maya';

export interface Conversation {
  id: string;
  mailbox: string;
  from: string;
  fromEmail: string;
  initials: string;
  subject: string;
  preview: string;
  body: string[];
  ago: string;
  /** The one skill this email fits (scripted matching). */
  fits: string | null;
}

export const CONVERSATIONS: Conversation[] = [
  {
    id: 'refund',
    mailbox: 'billing',
    from: 'Priya Shah',
    fromEmail: 'priya.shah@example.com',
    initials: 'PS',
    subject: 'Refund for order #4821',
    preview: 'The jacket arrived with a torn seam. Could I get my money back?',
    body: [
      'Hi there,',
      'The jacket from order #4821 arrived with a torn seam along the sleeve. I would rather not exchange it. Could I get my money back?',
      'Thanks,\nPriya',
    ],
    ago: '4 min',
    fits: 'refund-requests',
  },
  {
    id: 'api',
    mailbox: 'support',
    from: 'Marco Diaz',
    fromEmail: 'marco@example.com',
    initials: 'MD',
    subject: 'Getting 502 errors on /v2/orders',
    preview: 'Since this morning every call to /v2/orders returns a 502.',
    body: [
      'Hello,',
      'Since this morning every call to /v2/orders returns a 502. Our checkout depends on it, so this is urgent for us.',
      'Marco',
    ],
    ago: '12 min',
    fits: 'api-error-triage',
  },
  {
    id: 'email-change',
    mailbox: 'billing',
    from: 'Lena Fischer',
    fromEmail: 'lena.f@example.com',
    initials: 'LF',
    subject: 'Can I change my billing email?',
    preview: 'Our finance team moved to a new address. Can invoices go there?',
    body: [
      'Hi,',
      'Our finance team moved to a new address: ap@example.com. Can future invoices go there instead?',
      'Best,\nLena',
    ],
    ago: '26 min',
    fits: null,
  },
];

export const convById = (id: string) => CONVERSATIONS.find((c) => c.id === id)!;

// --- Who sees what in the / menu ---------------------------------------------

export type Surface = 'email' | 'admin';

export interface MenuContext {
  direction: Direction;
  surface: Surface;
  conv: Conversation | null;
  person: Person;
}

export interface MenuEntry {
  skill: Skill;
  /** True when the open email fits this skill's trigger. */
  fits: boolean;
  /** Listed but not runnable here, with the reason shown on the row. */
  disabled?: string;
}

function reachAllows(reach: Reach, person: Person): boolean {
  if (reach === 'everyone') return true;
  if (reach === 'billing') return person.team === 'Billing';
  return person.id === AUTHOR_ID;
}

/** The / menu for this place and person, in workspace order. Only C groups
 *  the skills that fit the open email first (SlashCopilot does that). */
export function slashMenu(skills: Skill[], ctx: MenuContext): MenuEntry[] {
  const out: MenuEntry[] = [];
  for (const skill of skills) {
    if (!skill.start.slash) continue;
    // A: / follows the skill's mailboxes. C: / follows the people it is shared with.
    // B: / works anywhere Copilot is.
    if (ctx.direction === 'c' && !reachAllows(skill.start.reach, ctx.person)) continue;
    if (ctx.surface === 'admin') {
      out.push({ skill, fits: false, disabled: 'Needs an open email or chat' });
      continue;
    }
    const conv = ctx.conv!;
    if (ctx.direction === 'a' && !skill.mailboxes.includes(conv.mailbox)) continue;
    out.push({ skill, fits: conv.fits === skill.id });
  }
  return out;
}

/** The skill that started on its own on this email, if any. */
export function autoRanOn(skills: Skill[], conv: Conversation): Skill | null {
  const s = skills.find((k) => k.id === conv.fits);
  if (!s || !s.start.auto || !s.mailboxes.includes(conv.mailbox)) return null;
  return s;
}

// --- What a run does (scripted) ---------------------------------------------

export interface RunScript {
  steps: string[];
  reply: string | null;
  /** One line on the outcome, shown when there is no reply to draft. */
  outcome?: string;
}

export function runScript(skill: Skill, conv: Conversation): RunScript {
  const fits = conv.fits === skill.id;
  if (skill.id === 'refund-requests' && fits) {
    return {
      steps: [
        'Found order #4821 in Shopify, placed 6 days ago',
        'Within 30 days, so refunded $86.00 to the original card',
        'Drafted a reply to Priya',
      ],
      reply:
        'Hi Priya, sorry about the torn seam. We have refunded $86.00 for order #4821 to your original card. It should show up in 5 to 7 business days.',
    };
  }
  if (skill.id === 'api-error-triage' && fits) {
    return {
      steps: [
        'Linked the 502s to the open incident on /v2/orders',
        'Tagged it API error and set priority to High',
        'Drafted a reply to Marco',
      ],
      reply:
        'Hi Marco, thanks for flagging this. We are seeing 502s on /v2/orders too and the team is on it. I will update you here as soon as it is fixed.',
    };
  }
  if (skill.id === 'order-status' && conv.id === 'refund') {
    return {
      steps: ['Found order #4821 in Shopify', 'Delivered 2 days ago'],
      reply: null,
      outcome: 'Order #4821 was delivered 2 days ago. Nothing to send: Priya is asking for a refund, not where her order is.',
    };
  }
  // Out of context: the skill runs, finds nothing it can act on, and stops.
  const nothing: Record<string, string> = {
    'refund-requests': 'Looked for an order to refund - this email does not mention one',
    'api-error-triage': 'Looked for an API error - this email does not describe one',
    'order-status': 'Looked for an order number - this email does not have one',
  };
  return {
    steps: [nothing[skill.id] ?? 'Looked for something this skill handles - found nothing'],
    reply: null,
    outcome: 'Stopped before taking any action. Nothing was changed on this email.',
  };
}

/** One-line summary of a skill's on-its-own run, for the thread. */
export function autoSummary(skill: Skill): string {
  if (skill.id === 'refund-requests') return 'Refunded $86.00 and drafted a reply';
  if (skill.id === 'api-error-triage') return 'Tagged API error, set priority to High, drafted a reply';
  return 'Ran its steps';
}
