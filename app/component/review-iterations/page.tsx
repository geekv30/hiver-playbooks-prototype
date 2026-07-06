import type { Metadata } from 'next';
import type { ReactNode } from 'react';
import {
  RiCheckLine,
  RiCheckboxCircleFill,
  RiErrorWarningFill,
  RiTimeFill,
} from 'react-icons/ri';
import { HubSpotIcon, ClickUpIcon } from '@/components/icons/connectors';
import { SparkleIcon, PlayIcon, TagIcon } from '@/components/icons/ui';
import Button from '@/components/atoms/Button';
import styles from './page.module.css';

export const metadata: Metadata = {
  title: 'Review modal · four iterations',
  description: 'The readiness review design iterations, side by side.',
};

/* One scenario across every version, so the comparison is apples-to-apples:
   HubSpot + ClickUp connected, evaluation not run, 2 tags missing, Varun
   needing an invite. Static exhibit - the live flow is /api-example -> Enable. */

type Tone = 'ok' | 'warn' | 'pending';

function Glyph({ tone }: { tone: Tone }) {
  const Icon =
    tone === 'warn' ? RiErrorWarningFill : tone === 'pending' ? RiTimeFill : RiCheckboxCircleFill;
  return (
    <span className={styles.glyph} data-tone={tone}>
      <Icon aria-hidden />
    </span>
  );
}

/** Shared modal chrome: header, verdict, scope, rows, footer. The rows are
 *  what each iteration changes - everything else stays fixed. */
function Chrome({ children, verdict }: { children: ReactNode; verdict?: 'warn' }) {
  return (
    <div className={styles.modal}>
      <header className={styles.head}>
        <span className={styles.headIcon} aria-hidden>
          <SparkleIcon />
        </span>
        <h3 className={styles.headTitle}>Review &amp; go live</h3>
        <span className={styles.stepCrumb}>Step 2 of 2</span>
      </header>
      <div className={styles.body}>
        <div className={styles.verdict} data-tone={verdict ?? 'warn'}>
          <RiErrorWarningFill aria-hidden />
          <span>1 thing needs attention before this AOP can run cleanly.</span>
        </div>
        <p className={styles.scope}>
          Checked against Sales, Support, Marketing, and 2 more · AI Agents
        </p>
        <ul className={styles.rows}>{children}</ul>
      </div>
      <footer className={styles.foot}>
        <span className={styles.backBtn}>Back</span>
        <span className={styles.goBtn}>Go live anyway</span>
      </footer>
    </div>
  );
}

const okStatus = (label: string) => (
  <span className={styles.v1status}>
    <RiCheckLine aria-hidden />
    {label}
  </span>
);

/* ---- v1: icon tiles + titles + paragraph details + trailing status ---- */
function V1Row({
  tile,
  title,
  detail,
  end,
}: {
  tile: ReactNode;
  title: string;
  detail: string;
  end: ReactNode;
}) {
  return (
    <li className={styles.v1row}>
      {tile}
      <span className={styles.v1text}>
        <span className={styles.v1title}>{title}</span>
        <span className={styles.v1detail}>{detail}</span>
      </span>
      <span className={styles.rowEnd}>{end}</span>
    </li>
  );
}

export default function ReviewIterationsPage() {
  return (
    <main className={styles.page}>
      <header className={styles.pageHead}>
        <h1 className={styles.pageTitle}>The readiness review, four iterations</h1>
        <p className={styles.pageSub}>
          One scenario everywhere: two connectors healthy, evaluation not run, two tags missing,
          one assignee awaiting an invite. The live version is v3 - open the worked example and
          click Enable to drive it.
        </p>
      </header>

      <div className={styles.grid}>
        {/* ---------------- v1 ---------------- */}
        <section className={styles.cell}>
          <div className={styles.caption}>
            <h2>v1 · Paragraph rows</h2>
            <p>
              Icon tiles + titles + comma-list paragraphs + trailing status labels. Complete, but
              a wall of text - and five visual grammars in one list.
            </p>
          </div>
          <Chrome>
            <V1Row
              tile={
                <span className={styles.v1tile}>
                  <HubSpotIcon />
                </span>
              }
              title="HubSpot"
              detail="Connected - 1 step is ready to run."
              end={okStatus('Connected')}
            />
            <V1Row
              tile={
                <span className={styles.v1tile}>
                  <ClickUpIcon />
                </span>
              }
              title="ClickUp"
              detail="Connected - 1 step is ready to run."
              end={okStatus('Connected')}
            />
            <V1Row
              tile={
                <span className={styles.v1tile} data-tone="pending">
                  <PlayIcon />
                </span>
              }
              title="Evaluation"
              detail="This AOP has never been evaluated. A quick run on past emails catches broken steps before customers see them."
              end={<Button variant="secondary">Evaluate</Button>}
            />
            <V1Row
              tile={
                <span className={styles.v1tile} data-tone="ok">
                  <TagIcon />
                </span>
              }
              title="Tags"
              detail="'api-error' is missing in Sales, Marketing, Customer Service, and Refunds; 'support' is missing in Marketing, Customer Service, and Refunds. We'll create them there when this AOP goes live."
              end={okStatus('Done for you')}
            />
            <V1Row
              tile={
                <span className={styles.v1tile} data-tone="warn">
                  V
                </span>
              }
              title="Varun"
              detail="This AOP assigns to Varun, but they're not a member of Sales, Marketing, Customer Service, and Refunds. Assignment steps there will pause until they join - everything else still runs."
              end={<Button variant="secondary">Send invite</Button>}
            />
          </Chrome>
        </section>

        {/* ---------------- v2 ---------------- */}
        <section className={styles.cell}>
          <div className={styles.caption}>
            <h2>v2 · One-liners + entity chips</h2>
            <p>
              Shorter copy; the lists became chips. Less text, but a third element type - the
              screen got busier, not calmer.
            </p>
          </div>
          <Chrome>
            <V1Row
              tile={
                <span className={styles.v1tile}>
                  <HubSpotIcon />
                </span>
              }
              title="HubSpot"
              detail="Connected - 1 step is ready to run."
              end={okStatus('Connected')}
            />
            <V1Row
              tile={
                <span className={styles.v1tile}>
                  <ClickUpIcon />
                </span>
              }
              title="ClickUp"
              detail="Connected - 1 step is ready to run."
              end={okStatus('Connected')}
            />
            <V1Row
              tile={
                <span className={styles.v1tile} data-tone="pending">
                  <PlayIcon />
                </span>
              }
              title="Evaluation"
              detail="Never evaluated - a quick run on past emails catches broken steps early."
              end={<Button variant="secondary">Evaluate</Button>}
            />
            <li className={styles.v1row}>
              <span className={styles.v1tile} data-tone="ok">
                <TagIcon />
              </span>
              <span className={styles.v1text}>
                <span className={styles.v1title}>Tags</span>
                <span className={styles.v1detail}>
                  Missing in some selected mailboxes - we&apos;ll create these tags when this AOP
                  goes live.
                </span>
                <span className={styles.chipRow}>
                  <span className={styles.chip}>
                    api-error <span className={styles.chipSub}>4 mailboxes</span>
                  </span>
                  <span className={styles.chip}>
                    support <span className={styles.chipSub}>3 mailboxes</span>
                  </span>
                </span>
              </span>
              <span className={styles.rowEnd}>{okStatus('Done for you')}</span>
            </li>
            <li className={styles.v1row}>
              <span className={styles.v1tile} data-tone="warn">
                V
              </span>
              <span className={styles.v1text}>
                <span className={styles.v1title}>Varun</span>
                <span className={styles.v1detail}>
                  This AOP assigns to Varun, who hasn&apos;t joined these mailboxes - assignment
                  pauses there until they do:
                </span>
                <span className={styles.chipRow}>
                  <span className={styles.chip}>Sales</span>
                  <span className={styles.chip}>Marketing</span>
                  <span className={styles.chip}>Customer Service</span>
                  <span className={styles.chip}>Refunds</span>
                </span>
              </span>
              <span className={styles.rowEnd}>
                <Button variant="secondary">Send invite</Button>
              </span>
            </li>
          </Chrome>
        </section>

        {/* ---------------- v3 ---------------- */}
        <section className={styles.cell}>
          <div className={styles.caption}>
            <h2>v3 · One glyph, one sentence, one button (live)</h2>
            <p>
              One grammar per row: state lives in the glyph, lists live inside the sentence as
              counts. This is what shipped.
            </p>
          </div>
          <Chrome>
            <li className={styles.v3row}>
              <Glyph tone="ok" />
              <span className={styles.v3sentence}>
                <strong>HubSpot</strong> is connected - 1 step ready to run.
              </span>
            </li>
            <li className={styles.v3row}>
              <Glyph tone="ok" />
              <span className={styles.v3sentence}>
                <strong>ClickUp</strong> is connected - 1 step ready to run.
              </span>
            </li>
            <li className={styles.v3row}>
              <Glyph tone="pending" />
              <span className={styles.v3sentence}>
                <strong>Evaluation</strong>{' '}hasn&apos;t been run yet - a quick pass on past emails
                catches broken steps early.
              </span>
              <span className={styles.rowEnd}>
                <Button variant="secondary">Evaluate</Button>
              </span>
            </li>
            <li className={styles.v3row}>
              <Glyph tone="ok" />
              <span className={styles.v3sentence}>
                <strong>2 tags</strong>{' '}are missing in 4 of the selected mailboxes - we&apos;ll
                create them for you at go-live.
              </span>
            </li>
            <li className={styles.v3row}>
              <Glyph tone="warn" />
              <span className={styles.v3sentence}>
                <strong>Varun</strong>{' '}isn&apos;t a member of 4 of the selected mailboxes -
                assignment pauses there until they join.
              </span>
              <span className={styles.rowEnd}>
                <Button variant="secondary">Send invite</Button>
              </span>
            </li>
          </Chrome>
        </section>

        {/* ---------------- v4.1 · triage ---------------- */}
        <section className={styles.cell}>
          <div className={styles.caption}>
            <h2>v4.1 · Triage - only problems get rows</h2>
            <p>
              Checks grouped by what they mean to you. Everything that&apos;s fine collapses into
              one green line - you read what needs you, and skip what doesn&apos;t.
            </p>
          </div>
          <Chrome>
            <li className={styles.groupHead}>
              Needs attention <span className={styles.groupCount} data-tone="warn">1</span>
            </li>
            <li className={styles.v3row}>
              <Glyph tone="warn" />
              <span className={styles.v3sentence}>
                <strong>Varun</strong>{' '}isn&apos;t a member of 4 of the selected mailboxes -
                assignment pauses there until they join.
              </span>
              <span className={styles.rowEnd}>
                <Button variant="secondary">Send invite</Button>
              </span>
            </li>
            <li className={styles.groupHead}>
              Pending <span className={styles.groupCount} data-tone="pending">1</span>
            </li>
            <li className={styles.v3row}>
              <Glyph tone="pending" />
              <span className={styles.v3sentence}>
                <strong>Evaluation</strong>{' '}hasn&apos;t been run yet - a quick pass catches
                broken steps early.
              </span>
              <span className={styles.rowEnd}>
                <Button variant="secondary">Evaluate</Button>
              </span>
            </li>
            <li className={styles.groupHead}>
              Ready <span className={styles.groupCount} data-tone="ok">3</span>
            </li>
            <li className={styles.v3row} data-last>
              <Glyph tone="ok" />
              <span className={styles.v3sentence}>
                <strong>HubSpot</strong> and <strong>ClickUp</strong> are connected, and 2 missing
                tags will be created for you at go-live.
              </span>
            </li>
          </Chrome>
        </section>

        {/* ---------------- v4.2 · inset group ---------------- */}
        <section className={styles.cell}>
          <div className={styles.caption}>
            <h2>v4.2 · Inset group - settings-card compactness</h2>
            <p>
              Every check as a 44px single-line row inside one quiet inset container. Headline-only
              copy; actions become accent text links. The whole review reads like one component.
            </p>
          </div>
          <Chrome>
            <li className={styles.inset}>
              <ul className={styles.insetRows}>
                <li className={styles.insetRow}>
                  <Glyph tone="ok" />
                  <span className={styles.insetText}>
                    <strong>HubSpot</strong> connected
                  </span>
                </li>
                <li className={styles.insetRow}>
                  <Glyph tone="ok" />
                  <span className={styles.insetText}>
                    <strong>ClickUp</strong> connected
                  </span>
                </li>
                <li className={styles.insetRow}>
                  <Glyph tone="pending" />
                  <span className={styles.insetText}>
                    <strong>Evaluation</strong> not run yet
                  </span>
                  <span className={styles.insetAction}>Evaluate</span>
                </li>
                <li className={styles.insetRow}>
                  <Glyph tone="ok" />
                  <span className={styles.insetText}>
                    <strong>2 tags</strong> will be created for you at go-live
                  </span>
                </li>
                <li className={styles.insetRow}>
                  <Glyph tone="warn" />
                  <span className={styles.insetText}>
                    <strong>Varun</strong> needs an invite to 4 mailboxes
                  </span>
                  <span className={styles.insetAction}>Send invite</span>
                </li>
              </ul>
            </li>
          </Chrome>
        </section>

        {/* ---------------- v4.3 · synthesis ---------------- */}
        <section className={styles.cell}>
          <div className={styles.caption}>
            <h2>v4.3 · Triage + inset groups (synthesis)</h2>
            <p>
              The triage order in the inset-card aesthetic: one quiet box per group, compact rows,
              ready items summarized. The verdict, the groups, and the CTA tell one story.
            </p>
          </div>
          <Chrome>
            <li className={styles.groupHead}>
              Needs attention <span className={styles.groupCount} data-tone="warn">1</span>
            </li>
            <li className={styles.inset}>
              <ul className={styles.insetRows}>
                <li className={styles.insetRow} data-tall>
                  <Glyph tone="warn" />
                  <span className={styles.insetText} data-wrap>
                    <strong>Varun</strong>{' '}isn&apos;t a member of 4 of the selected mailboxes -
                    assignment pauses there until they join
                  </span>
                  <span className={styles.rowEnd}>
                    <Button variant="secondary">Send invite</Button>
                  </span>
                </li>
              </ul>
            </li>
            <li className={styles.groupHead}>
              Pending <span className={styles.groupCount} data-tone="pending">1</span>
            </li>
            <li className={styles.inset}>
              <ul className={styles.insetRows}>
                <li className={styles.insetRow} data-tall>
                  <Glyph tone="pending" />
                  <span className={styles.insetText} data-wrap>
                    <strong>Evaluation</strong>{' '}hasn&apos;t been run yet - a quick pass catches
                    broken steps early
                  </span>
                  <span className={styles.rowEnd}>
                    <Button variant="secondary">Evaluate</Button>
                  </span>
                </li>
              </ul>
            </li>
            <li className={styles.groupHead}>
              Ready <span className={styles.groupCount} data-tone="ok">3</span>
            </li>
            <li className={styles.inset}>
              <ul className={styles.insetRows}>
                <li className={styles.insetRow} data-tall>
                  <Glyph tone="ok" />
                  <span className={styles.insetText} data-wrap>
                    <strong>HubSpot</strong> and <strong>ClickUp</strong> are connected · 2 missing
                    tags will be created for you
                  </span>
                </li>
              </ul>
            </li>
          </Chrome>
        </section>
      </div>
    </main>
  );
}
