import type { ConnectorSlug } from '@/types/playbook';
import { CONNECTOR_ICON } from '@/components/icons/connectors';
import { CONNECTOR_META } from '@/data/connectors';
import styles from './ConnectorTile.module.css';

interface Props {
  slug: ConnectorSlug;
  size?: 'md' | 'lg';
}

export default function ConnectorTile({ slug, size = 'md' }: Props) {
  const Icon = CONNECTOR_ICON[slug];
  const cls = `${styles.tile} ${size === 'lg' ? styles.lg : ''}`;
  if (Icon) return <span className={cls}><Icon /></span>;
  // Fallback: letter tile from first character of the connector name.
  return (
    <span className={cls}>
      <span className={styles.fallback}>{CONNECTOR_META[slug].name.charAt(0)}</span>
    </span>
  );
}
