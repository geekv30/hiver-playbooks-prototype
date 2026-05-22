import styles from './Kbd.module.css';

interface Props {
  children: React.ReactNode;
}

export default function Kbd({ children }: Props) {
  return <kbd className={styles.kbd}>{children}</kbd>;
}
