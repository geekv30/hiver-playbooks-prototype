'use client';

import type { ComponentType, ReactNode, SVGProps } from 'react';
import {
  RiCloseLine,
  RiHome5Line,
  RiInboxLine,
  RiGlobalLine,
  RiShapeLine,
  RiBook2Line,
  RiLayoutLine,
  RiBox3Line,
  RiPriceTag3Line,
  RiApps2Line,
  RiCodeBoxLine,
  RiUserLine,
  RiSettings3Line,
  RiVipCrown2Fill,
  RiArrowRightUpLine,
  RiArrowLeftLine,
} from 'react-icons/ri';
import GmailBar from '@/components/flow01/GmailBar';
import { SparkleIcon } from '@/components/icons/ui';
import styles from './AdminShell.module.css';

/** The shell's shared classes (the DLS buttons, the body bar), for its pages. */
export { styles as shellStyles };

type IconCmp = ComponentType<SVGProps<SVGSVGElement>>;

/** Admin Panel primary nav (Figma 3535:86193, HIG Primary Side Nav): grouped
 *  sections, the first untitled. Icons are the Remix matches for the Figma set. */
const MAIN_NAV: { title?: string; items: { label: string; icon: IconCmp; active?: boolean }[] }[] = [
  {
    items: [
      { label: 'Home', icon: RiHome5Line },
      { label: 'Shared Inboxes', icon: RiInboxLine },
      { label: 'Global Configuration', icon: RiGlobalLine },
    ],
  },
  {
    title: 'AI',
    items: [
      { label: 'Hiver AI', icon: SparkleIcon, active: true },
      { label: 'Knowledge Hub', icon: RiShapeLine },
    ],
  },
  {
    title: 'Resources',
    items: [
      { label: 'Help Center', icon: RiBook2Line },
      { label: 'Web Forms', icon: RiLayoutLine },
      { label: 'Custom Objects', icon: RiBox3Line },
      { label: 'Shared Labels', icon: RiPriceTag3Line },
    ],
  },
  {
    title: 'Integrations',
    items: [
      { label: 'Apps', icon: RiApps2Line },
      { label: 'Developer APIs', icon: RiCodeBoxLine },
    ],
  },
  {
    title: 'Organization',
    items: [
      { label: 'Users and Roles', icon: RiUserLine },
      { label: 'Settings', icon: RiSettings3Line },
    ],
  },
];

/** Hiver AI section nav (Figma 3535:86194). Insights items are paid add-ons,
 *  marked with the crown. */
const AI_NAV: { title?: string; items: { label: string; paid?: boolean }[] }[] = [
  { items: [{ label: 'AI Copilot' }, { label: 'AI Agent' }, { label: 'Skills' }] },
  { title: 'Insights', items: [{ label: 'AI QA', paid: true }, { label: 'AI Topics', paid: true }] },
];

/**
 * The Hiver Admin frame for the Skills section (Figma 3535:86190): Gmail bar,
 * grouped Admin nav, Hiver AI nav, a page header, a scrolling body (Figma
 * 3535:86220 - `bar` is its top row, `children` the rest), and the AI-data
 * footer. The Skills list and the New skill page both render inside it, so the
 * two can't drift apart.
 */
export default function AdminShell({
  title,
  subtitle,
  onBack,
  actions,
  bar,
  children,
  bodyEmpty,
}: {
  title: string;
  /** A section page's one-line description; a sub-page (New skill) has none. */
  subtitle?: string;
  /** A sub-page (Figma Insights 1474:49089): a bare back arrow before a 16px
   *  title, in a shorter header. */
  onBack?: () => void;
  /** Header actions on the right. Defaults to "Learn". */
  actions?: ReactNode;
  /** The body's top row (count line, actions, back link). */
  bar?: ReactNode;
  children: ReactNode;
  /** The body holds an empty state (styling hook). */
  bodyEmpty?: boolean;
}) {
  return (
    <div className={styles.page}>
      <GmailBar />
      <div className={styles.shell}>
        {/* ---- Admin Panel main nav ---- */}
        <aside className={styles.mainNav}>
          <div className={styles.mainNavHead}>
            <span className={styles.hiverMark} aria-hidden>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src="/hiver-yellow-mark.svg" alt="" />
            </span>
            <span className={styles.mainNavHeadText}>
              <span className={styles.mainNavOverline}>Hiver</span>
              <span className={styles.mainNavTitle}>Admin Panel</span>
            </span>
            <button type="button" className={styles.mainNavClose} aria-label="Close admin panel" tabIndex={-1}>
              <RiCloseLine />
            </button>
          </div>
          <nav className={styles.mainNavMenu} aria-label="Admin panel">
            {MAIN_NAV.map((section, i) => (
              <div key={section.title ?? i} className={styles.navSection}>
                {section.title && <p className={styles.navSectionTitle}>{section.title}</p>}
                {section.items.map(({ label, icon: Icon, active }) => (
                  <button
                    key={label}
                    type="button"
                    className={styles.mainNavItem}
                    data-active={active || undefined}
                    aria-current={active ? 'page' : undefined}
                  >
                    <Icon className={styles.mainNavIcon} aria-hidden />
                    <span className={styles.navLabel}>{label}</span>
                  </button>
                ))}
              </div>
            ))}
          </nav>
        </aside>

        {/* ---- Hiver AI section nav ---- */}
        <aside className={styles.aiNav}>
          <p className={styles.aiNavHead}>Hiver AI</p>
          <nav className={styles.aiNavMenu} aria-label="Hiver AI">
            {AI_NAV.map((section, i) => (
              <div key={section.title ?? i} className={styles.aiNavSection}>
                {section.title && <p className={styles.aiNavSectionTitle}>{section.title}</p>}
                {section.items.map(({ label, paid }) => (
                  <button
                    key={label}
                    type="button"
                    className={styles.aiNavItem}
                    data-active={label === 'Skills' || undefined}
                    aria-current={label === 'Skills' ? 'page' : undefined}
                  >
                    <span className={styles.navLabel}>{label}</span>
                    {paid && <RiVipCrown2Fill className={styles.crown} aria-label="Paid add-on" />}
                  </button>
                ))}
              </div>
            ))}
          </nav>
        </aside>

        {/* ---- Page: header, body (Figma 3535:86220), AI-data footer ---- */}
        <main className={styles.main}>
          <header className={styles.header} data-sub={onBack ? true : undefined}>
            {onBack && (
              <button type="button" className={styles.backBtn} aria-label="Back to skills" onClick={onBack}>
                <RiArrowLeftLine aria-hidden />
              </button>
            )}
            <div className={styles.titleBlock}>
              <h1 className={styles.title}>{title}</h1>
              {subtitle && <p className={styles.subtitle}>{subtitle}</p>}
            </div>
            {actions ?? (
              <a href="#" onClick={(e) => e.preventDefault()} className={styles.learnBtn}>
                Learn
                <RiArrowRightUpLine aria-hidden />
              </a>
            )}
          </header>

          <div className={styles.body} data-empty={bodyEmpty || undefined} data-nobar={!bar || undefined}>
            {bar && <div className={styles.bodyBar}>{bar}</div>}
            {children}
          </div>

          <footer className={styles.footer}>
            <p className={styles.footerNote}>
              To opt out of AI features, contact Hiver support at{' '}
              <a href="mailto:support@hiverhq.com" className={styles.footerLink}>
                support@hiverhq.com
              </a>
            </p>
            <a href="#" onClick={(e) => e.preventDefault()} className={styles.footerAction}>
              See how Hiver uses your data for AI
              <RiArrowRightUpLine aria-hidden />
            </a>
          </footer>
        </main>
      </div>
    </div>
  );
}
