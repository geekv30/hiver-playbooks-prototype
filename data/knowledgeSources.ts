// Knowledge Hub sources the "Search Knowledge Hub" action can target.
//
// Mirrors the SHAPE of Hiver's Knowledge Hub (the 7 source types + per-source
// rows), but every entry is a GENERIC placeholder for a believable support team -
// never a real account's sources/people (reusability rule). Swap for live Hub
// data (scoped to the AOP's mailbox) when wired to a backend.

export type SourceTypeId =
  | 'help'
  | 'confluence'
  | 'gdrive'
  | 'notion'
  | 'document'
  | 'snippet'
  | 'website';

export interface SourceType {
  id: SourceTypeId;
  /** Heading shown in the picker (matches the Hub's own labels). */
  label: string;
}

// Ordered as the picker lists them (brand-heavy, populated types first).
export const SOURCE_TYPES: SourceType[] = [
  { id: 'help', label: 'Help center' },
  { id: 'confluence', label: 'Confluence' },
  { id: 'gdrive', label: 'Google Drive' },
  { id: 'notion', label: 'Notion' },
  { id: 'document', label: 'Document' },
  { id: 'snippet', label: 'Snippet' },
  { id: 'website', label: 'Website' },
];

export interface KbSource {
  id: string;
  name: string;
  type: SourceTypeId;
  /** Secondary line - page/article count or kind, as the Hub shows it. */
  sub: string;
}

export const KB_SOURCES: KbSource[] = [
  { id: 'help-center', name: 'Product help center', type: 'help', sub: '142 articles' },
  { id: 'conf-eng', name: 'Engineering space', type: 'confluence', sub: '24 pages' },
  { id: 'conf-policy', name: 'Policies space', type: 'confluence', sub: '8 pages' },
  { id: 'gdrive-playbooks', name: 'Support playbooks', type: 'gdrive', sub: '36 files' },
  { id: 'gdrive-onboard', name: 'Onboarding guide', type: 'gdrive', sub: 'Doc' },
  { id: 'notion-wiki', name: 'Team wiki', type: 'notion', sub: 'Workspace' },
  { id: 'notion-releases', name: 'Release notes', type: 'notion', sub: '12 pages' },
  { id: 'doc-refund', name: 'Refund policy.pdf', type: 'document', sub: '1 file' },
  { id: 'doc-sla', name: 'Shipping SLA.pdf', type: 'document', sub: '1 file' },
  { id: 'snippet-canned', name: 'Canned responses', type: 'snippet', sub: '18 snippets' },
  { id: 'site-docs', name: 'Public docs site', type: 'website', sub: 'Crawled weekly' },
];

export function sourceTypeLabel(id: SourceTypeId): string {
  return SOURCE_TYPES.find((t) => t.id === id)?.label ?? id;
}

export function sourcesByType(id: SourceTypeId): KbSource[] {
  return KB_SOURCES.filter((s) => s.type === id);
}

export function sourceCountByType(id: SourceTypeId): number {
  return KB_SOURCES.reduce((n, s) => (s.type === id ? n + 1 : n), 0);
}

export function findKbSource(id: string): KbSource | undefined {
  return KB_SOURCES.find((s) => s.id === id);
}
