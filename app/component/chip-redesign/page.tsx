'use client';
import Link from 'next/link';
import {
  RiSparklingLine, RiPriceTag3Line, RiStickyNoteLine, RiSearchLine,
  RiCheckDoubleLine, RiTimeLine, RiGitBranchLine, RiStopCircleLine,
} from 'react-icons/ri';
import { SiSlack, SiHubspot } from 'react-icons/si';
import type { IconType } from 'react-icons';
import styles from './chip-redesign.module.css';

type Bucket = 'read' | 'ticket' | 'external' | 'human' | 'wait' | 'flow';

interface ChipDef {
  brand?: string;
  verb: string;
  meta?: string;
  bucket: Bucket;
  icon: IconType;
}

// Same example sentence rendered with each design.
const SENTENCE: { text?: string; chip?: ChipDef }[] = [
  { chip: { verb: 'AI Extract', meta: 'tour · dates · group', bucket: 'read', icon: RiSparklingLine } },
  { text: ' from the inbound message. Then ' },
  { chip: { brand: 'Slack', verb: 'Send message', meta: '#tour-team', bucket: 'external', icon: SiSlack } },
  { text: ' and ' },
  { chip: { verb: 'Tag', meta: '@tour.name', bucket: 'ticket', icon: RiPriceTag3Line } },
  { text: ' so the team can sort by tour.' },
];

const PROSE_LEADER = (
  <>WHEN <span className={styles.refchipNote}>info@walkjapan.com</span> receives an email containing <code className={styles.codeFragNote}>&quot;tour&quot;</code>. </>
);

// ============================================================
// 8 chip renderers
// ============================================================

function ChipA({ chip }: { chip: ChipDef }) {
  const Icon = chip.icon;
  return (
    <span className={styles.chipA}>
      <span className={styles.chipAIco}><Icon /></span>
      {chip.brand && (
        <>
          <span className={styles.chipABrand}>{chip.brand}</span>
          <span className={styles.chipASep}>·</span>
        </>
      )}
      <span className={styles.chipAVerb}>{chip.verb}</span>
      {chip.meta && <span className={styles.chipAMeta}>{chip.meta}</span>}
    </span>
  );
}

function ChipB({ chip }: { chip: ChipDef }) {
  const Icon = chip.icon;
  return (
    <span className={styles.chipB} data-bucket={chip.bucket}>
      <span className={styles.chipBIco}><Icon /></span>
      {chip.brand && <span className={styles.chipBBrand}>{chip.brand} · </span>}
      <span className={styles.chipBVerb}>{chip.verb}</span>
      {chip.meta && <span className={styles.chipBMeta}>{chip.meta}</span>}
    </span>
  );
}

function ChipC({ chip }: { chip: ChipDef }) {
  return (
    <span className={styles.chipC} data-bucket={chip.bucket}>
      <span className={styles.chipCDot} />
      {chip.brand && <span className={styles.chipCBrand}>{chip.brand} </span>}
      <span className={styles.chipCVerb}>{chip.verb}</span>
      {chip.meta && <span className={styles.chipCMeta}>{chip.meta}</span>}
    </span>
  );
}

function ChipD({ chip }: { chip: ChipDef }) {
  return (
    <span className={styles.chipD}>
      <span className={styles.chipDBracket}>[</span>
      {chip.brand && <span className={styles.chipDBrand}>{chip.brand}: </span>}
      <span className={styles.chipDVerb}>{chip.verb}</span>
      {chip.meta && (
        <>
          <span className={styles.chipDArrow}> → </span>
          <span className={styles.chipDMeta}>{chip.meta}</span>
        </>
      )}
      <span className={styles.chipDBracket}>]</span>
    </span>
  );
}

function ChipE({ chip }: { chip: ChipDef }) {
  return (
    <span className={styles.chipE} data-bucket={chip.bucket}>
      <span className={styles.chipETag}>{(chip.brand ? `${chip.brand}.` : '') + chip.verb.toUpperCase().replace(/\s/g, '_')}</span>
      {chip.meta && <span className={styles.chipEMeta}>{chip.meta}</span>}
    </span>
  );
}

function ChipF({ chip }: { chip: ChipDef }) {
  return (
    <span className={styles.chipF} data-bucket={chip.bucket}>
      <span className={styles.chipFAt}>@</span>
      {chip.brand && <span className={styles.chipFBrand}>{chip.brand}.</span>}
      <span className={styles.chipFVerb}>{chip.verb}</span>
      {chip.meta && <span className={styles.chipFMeta}>({chip.meta})</span>}
    </span>
  );
}

function ChipG({ chip }: { chip: ChipDef }) {
  return (
    <code className={styles.chipG}>
      {chip.brand && <span className={styles.chipGBrand}>{chip.brand.toLowerCase()}.</span>}
      <span className={styles.chipGVerb}>{chip.verb.toLowerCase().replace(/\s/g, '_')}</span>
      <span className={styles.chipGParen}>(</span>
      {chip.meta && <span className={styles.chipGMeta}>{chip.meta}</span>}
      <span className={styles.chipGParen}>)</span>
    </code>
  );
}

function ChipH({ chip }: { chip: ChipDef }) {
  const Icon = chip.icon;
  return (
    <span className={styles.chipH} data-bucket={chip.bucket}>
      <span className={styles.chipHIco}><Icon /></span>
      {chip.brand && <span className={styles.chipHBrand}>{chip.brand} · </span>}
      <span className={styles.chipHVerb}>{chip.verb}</span>
      {chip.meta && <span className={styles.chipHMeta}>{chip.meta}</span>}
    </span>
  );
}

const VARIANTS: {
  id: string;
  letter: string;
  name: string;
  philosophy: string;
  pros: string[];
  cons: string[];
  render: (chip: ChipDef) => React.ReactNode;
}[] = [
  {
    id: 'A',
    letter: 'A',
    name: 'Current - bordered pill',
    philosophy: 'Today\'s atom. 1px hairline border, white bg, icon + verb + meta with hairline divider.',
    pros: ['Status states are unambiguous', 'Buckets read at a glance via icon'],
    cons: ['Reads as a button, not a word', 'Multi-chip lines look like a toolbar', 'Heaviest visual weight in the prose'],
    render: (chip) => <ChipA chip={chip} />,
  },
  {
    id: 'B',
    letter: 'B',
    name: 'Soft pill (no border)',
    philosophy: 'Same shape as A, but the border is gone and the bg is the only signal. Icon is dimmed slightly.',
    pros: ['Lighter weight than A', 'Bucket still implied by icon', 'Easy migration from current'],
    cons: ['Still pill-shaped, still "button-y"', 'Bg can disappear on light themes'],
    render: (chip) => <ChipB chip={chip} />,
  },
  {
    id: 'C',
    letter: 'C',
    name: 'Underlined verb (link-style)',
    philosophy: 'No bg, no border. Tiny colored dot prefix + verb with dotted underline. Meta as muted mono. Reads as a hyperlink in prose.',
    pros: ['Most prose-friendly - reads as text', 'Bucket signaled by tiny dot color', 'Almost zero visual weight'],
    cons: ['Status states are harder to layer', 'Hover/focus needs more care'],
    render: (chip) => <ChipC chip={chip} />,
  },
  {
    id: 'D',
    letter: 'D',
    name: 'Bracketed text',
    philosophy: 'Literal `[Brand: Verb → meta]` brackets in mono. No background, no border at all.',
    pros: ['Most "natural-language" - looks like an annotation', 'Zero chrome'],
    cons: ['Brackets add visual noise', 'Hard to distinguish bucket without icon'],
    render: (chip) => <ChipD chip={chip} />,
  },
  {
    id: 'E',
    letter: 'E',
    name: 'Tag-pill (uppercase mono)',
    philosophy: 'Tiny uppercase mono tag like a Notion property. `TAG · @tour.name`.',
    pros: ['Very compact', 'Distinct from prose without being heavy'],
    cons: ['No icon = no immediate bucket signal', 'Uppercase mono can feel shouty in long sentences'],
    render: (chip) => <ChipE chip={chip} />,
  },
  {
    id: 'F',
    letter: 'F',
    name: 'Mention-style (@verb)',
    philosophy: 'Notion-style @mention. `@Verb(meta)` with a subtle bg, no border.',
    pros: ['Familiar idiom (matches @-references everywhere)', 'Compact'],
    cons: ['@-prefix conflicts with the actual @-ref menu we use', 'Parens read as function-call'],
    render: (chip) => <ChipF chip={chip} />,
  },
  {
    id: 'G',
    letter: 'G',
    name: 'Inline code (function-call)',
    philosophy: 'Mono font, looks like inline code. `slack.send_message("#tour-team")`.',
    pros: ['Programmer-y but compact', 'Already familiar mono+code-bg idiom'],
    cons: ['Reads as code, not prose - alienates non-technical users', 'Loses the verb-as-prose intent'],
    render: (chip) => <ChipG chip={chip} />,
  },
  {
    id: 'H',
    letter: 'H',
    name: 'Bucket-tinted soft pill',
    philosophy: 'B but the bg is bucket-tinted. read=amber, ticket=sky, external=mint, human=lavender, wait=sand, flow=peach. Bucket color does the signaling currently done by icon weight.',
    pros: ['Bucket affordance built into bg color', 'Light visual weight', 'Status states map cleanly (saturate tint)'],
    cons: ['Color blindness - bucket signal lost', 'Tints need a dark-mode pairing later'],
    render: (chip) => <ChipH chip={chip} />,
  },
];

function Sentence({ render }: { render: (chip: ChipDef) => React.ReactNode }) {
  return (
    <p className={styles.sentence}>
      {PROSE_LEADER}
      {SENTENCE.map((part, i) =>
        part.text
          ? <span key={i}>{part.text}</span>
          : <span key={i}>{render(part.chip!)}</span>
      )}
    </p>
  );
}

export default function ChipRedesignPage() {
  return (
    <div className={styles.page}>
      <header className={styles.docbar}>
        <Link href="/atoms" className={styles.brand}>P</Link>
        <div className={styles.crumb}>
          <Link href="/component/canvas">AOPs</Link>
          <span className={styles.csep}>/</span>
          <span className={styles.name}>Chip redesign</span>
        </div>
        <span className={styles.spacer} />
        <Link className={styles.linkbtn} href="/component/canvas">Canvas</Link>
        <Link className={styles.linkbtn} href="/component/inline-actions">Inline Actions</Link>
        <Link className={styles.linkbtn} href="/component/inspector">Configure spec</Link>
      </header>

      <div className={styles.wrap}>
        <div className={styles.hero}>
          <span className={styles.eyebrow}>Exploration · chip atom redesign</span>
          <h1 className={styles.h1}>Eight ways to render an inline action - pick the one that doesn&apos;t intrude in prose</h1>
          <p className={styles.lede}>
            The current chip (A) looks like a button sitting in the sentence. Multi-chip lines read as a toolbar, not a sentence. This route shows the same Walk Japan opener rendered eight ways. Skim, pick a winner, the canvas will use it.
          </p>
          <div className={styles.heroMeta}>
            <span><strong>Common sentence:</strong> seeded across all variants</span>
            <span><strong>Three chips per line:</strong> AI Extract / Slack Send / Tag</span>
            <span><strong>Pick by:</strong> least intrusive to the prose flow</span>
          </div>
        </div>

        {VARIANTS.map((v) => (
          <section key={v.id} className={styles.variant} data-variant={v.id}>
            <div className={styles.variantHead}>
              <span className={styles.variantLetter}>{v.letter}</span>
              <div className={styles.variantHeadText}>
                <h2 className={styles.variantName}>{v.name}</h2>
                <p className={styles.variantPhilosophy}>{v.philosophy}</p>
              </div>
            </div>

            <div className={styles.sentenceBlock}>
              <span className={styles.sentenceLabel}>Sentence</span>
              <Sentence render={v.render} />
            </div>

            <div className={styles.contextBlock}>
              <div className={styles.contextCol}>
                <span className={styles.contextLabel}>In a list of step rows</span>
                <div className={styles.contextRow}>
                  <span className={styles.dotIdle} />
                  <span className={styles.contextNum}>01</span>
                  <span className={styles.contextBody}>
                    <Sentence render={v.render} />
                  </span>
                </div>
                <div className={styles.contextRow}>
                  <span className={styles.dotOk} />
                  <span className={styles.contextNum}>02</span>
                  <span className={styles.contextBody}>
                    {v.render({ brand: 'HubSpot', verb: 'Find contact', meta: 'by from_email', bucket: 'read', icon: SiHubspot })} so we can personalise the reply.
                  </span>
                </div>
                <div className={styles.contextRow}>
                  <span className={styles.dotOk} />
                  <span className={styles.contextNum}>03</span>
                  <span className={styles.contextBody}>
                    {v.render({ verb: 'Note', meta: 'tour · dates · group · concerns', bucket: 'ticket', icon: RiStickyNoteLine })} so the on-shift agent has full context.
                  </span>
                </div>
                <div className={styles.contextRow}>
                  <span className={styles.dotOk} />
                  <span className={styles.contextNum}>04</span>
                  <span className={styles.contextBody}>
                    {v.render({ verb: 'Wait', meta: '5 days', bucket: 'wait', icon: RiTimeLine })} for the customer to reply.
                  </span>
                </div>
                <div className={styles.contextRow}>
                  <span className={styles.dotOk} />
                  <span className={styles.contextNum}>05</span>
                  <span className={styles.contextBody}>
                    {v.render({ verb: 'Approval', meta: 'manager · 24h', bucket: 'human', icon: RiCheckDoubleLine })} before sending.
                  </span>
                </div>
              </div>
              <div className={styles.contextCol}>
                <span className={styles.contextLabel}>Status states</span>
                <div className={styles.statusRow}><span>Default</span>{v.render({ verb: 'Tag', meta: '@tour.name', bucket: 'ticket', icon: RiPriceTag3Line })}</div>
                <div className={styles.statusRow}><span>Selected</span><span data-selected="true">{v.render({ verb: 'Tag', meta: '@tour.name', bucket: 'ticket', icon: RiPriceTag3Line })}</span></div>
                <div className={styles.statusRow}><span>Unconfigured</span><span data-state="draft">{v.render({ verb: 'Tag what?', bucket: 'ticket', icon: RiPriceTag3Line })}</span></div>
                <div className={styles.statusRow}><span>Running</span><span data-state="running">{v.render({ verb: 'Tag', meta: '@tour.name', bucket: 'ticket', icon: RiPriceTag3Line })}</span></div>
                <div className={styles.statusRow}><span>Ok</span><span data-state="ok">{v.render({ verb: 'Tag', meta: '@tour.name', bucket: 'ticket', icon: RiPriceTag3Line })}</span></div>
                <div className={styles.statusRow}><span>Error</span><span data-state="error">{v.render({ verb: 'Tag', meta: '@tour.name', bucket: 'ticket', icon: RiPriceTag3Line })}</span></div>
              </div>
            </div>

            <div className={styles.notesBlock}>
              <div className={styles.notesCol}>
                <span className={styles.notesLabel}>What&apos;s good</span>
                <ul className={styles.notesList}>
                  {v.pros.map((p, i) => <li key={i}>{p}</li>)}
                </ul>
              </div>
              <div className={styles.notesCol}>
                <span className={styles.notesLabel}>What&apos;s not</span>
                <ul className={styles.notesList} data-tone="con">
                  {v.cons.map((c, i) => <li key={i}>{c}</li>)}
                </ul>
              </div>
            </div>
          </section>
        ))}

        <section className={styles.recoBlock}>
          <span className={styles.eyebrow}>Recommended</span>
          <h2 className={styles.recoTitle}>Design H - bucket-tinted soft pill (with C as runner-up)</h2>
          <p className={styles.recoBody}>
            H removes the heaviest visual weight (the border) while keeping the chip identifiable in prose. The bucket-color tint replaces the icon as the &quot;what kind of action&quot; signal. Status states map cleanly by saturating the tint. C is a strong runner-up - most prose-friendly - but layering test-run states on top of a flat underline is fiddly.
          </p>
          <p className={styles.recoBody}>
            <strong>If you pick differently:</strong> tell me which letter and I&apos;ll apply it across canvas + inline-actions + inspector + tag in one pass.
          </p>
        </section>
      </div>
    </div>
  );
}
