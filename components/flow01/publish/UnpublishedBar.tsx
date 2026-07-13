'use client';

import { RiInformationFill } from 'react-icons/ri';
import type { DeployStatus } from '../doc';
import styles from './UnpublishedBar.module.css';

interface Props {
  /** Runtime status of the AOP being edited ('active' | 'paused'). */
  status: DeployStatus;
  /** Throw away the unpublished edits (undoable; the caller toasts it). */
  onDiscard: () => void;
}

// The unpublished-changes strip (draft-and-publish model, the Zapier/Intercom
// convention): shown under the toolbar while a live or paused AOP's working
// doc diverges from its published snapshot. It carries the one fact the user
// must know - the running AOP has NOT changed yet - plus the quiet way out.
// Publishing lives on the toolbar's "Publish changes"; this never duplicates it.
export default function UnpublishedBar({ status, onDiscard }: Props) {
  return (
    <div className={styles.bar} role="status">
      <RiInformationFill className={styles.icon} aria-hidden />
      <span className={styles.msg}>
        {status === 'paused'
          ? 'This AOP is paused - your edits apply when you publish them.'
          : "You're editing a live AOP - it keeps running the published version until you publish your changes."}
      </span>
      <button type="button" className={styles.discard} onClick={onDiscard}>
        Discard edits
      </button>
    </div>
  );
}
