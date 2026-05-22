import styles from './SectionEyebrow.module.css';

interface Props {
  children: React.ReactNode;
}

export default function SectionEyebrow({ children }: Props) {
  return <span className={styles.eyebrow}>{children}</span>;
}
