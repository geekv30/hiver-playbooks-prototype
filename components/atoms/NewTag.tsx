import styles from './NewTag.module.css';

/**
 * NewTag - the "NEW" marker on a capability the user has not met yet
 * (Figma 3356:30386). One renderer for every place it appears, so the Evaluate
 * menu card and Copilot's matching row can never drift apart.
 */
export default function NewTag() {
  return <span className={styles.tag}>NEW</span>;
}
