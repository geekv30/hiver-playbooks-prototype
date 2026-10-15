'use client';

import { RiFlashlightLine } from 'react-icons/ri';
import Avatar from '@/components/atoms/Avatar';
import CopilotSparkle from '@/components/flow01/copilot/CopilotSparkle';
import { mailboxName } from '@/data/mailboxes';
import SlashCopilot from './SlashCopilot';
import {
  CONVERSATIONS,
  autoRanOn,
  autoSummary,
  convById,
  slashMenu,
  type Direction,
  type Person,
  type Skill,
  type Surface,
} from './model';
import styles from './HiverSurface.module.css';

const AVATAR_COLOR: Record<string, string> = { refund: '#8789C5', api: '#6BA4B8', 'email-change': '#C58787' };

interface Props {
  direction: Direction;
  surface: Surface;
  convId: string;
  onConv: (id: string) => void;
  skills: Skill[];
  person: Person;
}

/* A Hiver screen with Copilot docked on the right: the shared inbox (a
   conversation list and the open email) or the admin panel, where there is
   no conversation for a skill to work on. */
export default function HiverSurface({ direction, surface, convId, onConv, skills, person }: Props) {
  const conv = surface === 'email' ? convById(convId) : null;
  const entries = slashMenu(skills, { direction, surface, conv, person });
  const ran = conv ? autoRanOn(skills, conv) : null;
  // Copilot starts over when the place, the person or the rules change.
  const copilotKey = `${direction}-${surface}-${convId}-${person.id}`;

  return (
    <div className={styles.frame} data-surface={surface}>
      {surface === 'email' ? (
        <>
          <nav className={styles.list} aria-label="Conversations">
            <p className={styles.listHead}>Inbox</p>
            {CONVERSATIONS.map((c) => (
              <button
                key={c.id}
                type="button"
                className={styles.item}
                data-active={c.id === convId || undefined}
                aria-current={c.id === convId || undefined}
                onClick={() => onConv(c.id)}
              >
                <span className={styles.itemTop}>
                  <span className={styles.itemFrom}>{c.from}</span>
                  <span className={styles.itemAgo}>{c.ago}</span>
                </span>
                <span className={styles.itemSubject}>{c.subject}</span>
                <span className={styles.itemPreview}>{c.preview}</span>
                <span className={styles.itemBox}>{mailboxName(c.mailbox)}</span>
              </button>
            ))}
          </nav>
          <article className={styles.mail}>
            <header className={styles.mailHead}>
              <h3 className={styles.subject}>{conv!.subject}</h3>
              <span className={styles.box}>{mailboxName(conv!.mailbox)}</span>
            </header>
            <div className={styles.mailBody}>
              <div className={styles.sender}>
                <Avatar initials={conv!.initials} size={28} color={AVATAR_COLOR[conv!.id]} />
                <div className={styles.senderText}>
                  <span className={styles.senderName}>{conv!.from}</span>
                  <span className={styles.senderMail}>{conv!.fromEmail}</span>
                </div>
                <span className={styles.itemAgo}>{conv!.ago} ago</span>
              </div>
              {conv!.body.map((p, i) => (
                <p key={i} className={styles.para}>
                  {p}
                </p>
              ))}
              {ran ? (
                <div className={styles.event} key={`${ran.id}-${convId}`}>
                  <span className={styles.eventIco} aria-hidden>
                    <RiFlashlightLine />
                  </span>
                  <span className={styles.eventText}>
                    <strong>{ran.name}</strong> ran on its own: {autoSummary(ran)}.
                  </span>
                </div>
              ) : (
                <p className={styles.noEvent}>
                  <CopilotSparkle size={13} tone="flat" />
                  No skill ran on its own here.
                </p>
              )}
            </div>
          </article>
        </>
      ) : (
        <section className={styles.admin} aria-label="Admin panel">
          <nav className={styles.adminNav}>
            {['Mailboxes', 'Users', 'Skills', 'Tags', 'SLA policies'].map((n) => (
              <span key={n} className={styles.adminNavItem} data-active={n === 'Mailboxes' || undefined}>
                {n}
              </span>
            ))}
          </nav>
          <div className={styles.adminMain}>
            <h3 className={styles.subject}>Mailboxes</h3>
            <ul className={styles.adminRows}>
              {['Support', 'Billing', 'Refunds', 'Sales'].map((m) => (
                <li key={m}>
                  <span>{m}</span>
                  <span className={styles.itemAgo}>{m.toLowerCase()}@yourco.com</span>
                </li>
              ))}
            </ul>
          </div>
        </section>
      )}
      <SlashCopilot key={copilotKey} direction={direction} entries={entries} conv={conv} />
    </div>
  );
}
