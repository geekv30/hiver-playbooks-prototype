'use client';

import { useLayoutEffect, useRef } from 'react';
import styles from './CopilotMorph.module.css';

interface Props {
  /** The cold-start modal surface rect, captured at exit. */
  from: DOMRect;
  /** The docked panel surface rect, measured live. */
  to: DOMRect;
  /** Called once the travel finishes so the caller can swap to the real dock. */
  onDone: () => void;
}

/**
 * A throwaway fixed-position bridge that visually carries the cold-start
 * "Draft your AOP with AI" modal into the docked Copilot panel, so the two
 * read as ONE Copilot in two shapes.
 *
 * Technique (FLIP, transform + opacity only): the surface is laid out AT the
 * destination rect, inverted to the source on the first frame, then released to
 * identity so it springs home. While it travels, a cheap "hero" layer (the
 * modal's title + describe-box) cross-fades out and a cheap "dock" layer (the
 * tabs + composer) cross-fades in. The composer/input shape sits at the SAME
 * relative position (surface bottom) in both layers, so the eye tracks one
 * element across the move - that anchor is what sells "same Copilot".
 *
 * This is a VISUAL stand-in only: it never mounts the real modal or the real
 * Copilot panel. Both are cheap shapes drawn from the same card/hairline tokens.
 */
export default function CopilotMorph({ from, to, onDone }: Props) {
  const ref = useRef<HTMLDivElement>(null);
  const dockRef = useRef<HTMLDivElement>(null);
  const done = useRef(false);

  useLayoutEffect(() => {
    const el = ref.current;
    if (!el) return;

    // FLIP invert: the element is already laid out at `to`; pre-place it at `from`.
    const dx = from.left - to.left;
    const dy = from.top - to.top;
    const sx = from.width / to.width;
    const sy = from.height / to.height;
    el.style.transformOrigin = 'top left';
    el.style.transform = `translate(${dx}px, ${dy}px) scale(${sx}, ${sy})`;
    // Counter-scale the dock (landing) layer by the inverse, on the same beat, so
    // the incoming Copilot content keeps true proportions instead of stretching
    // with the container - net scale stays ~1 the whole way. The hero layer is
    // left to scale + fade (its distortion is masked because it is gone fast).
    const dock = dockRef.current;
    if (dock) {
      dock.style.transformOrigin = 'top left';
      dock.style.transform = `scale(${1 / sx}, ${1 / sy})`;
    }
    void el.getBoundingClientRect(); // force the inverted first frame to paint

    const finish = () => {
      if (done.current) return;
      done.current = true;
      onDone();
    };

    // Reduced motion: no travel - hand off to the real dock on the next frame.
    const reduce =
      typeof window !== 'undefined' &&
      window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (reduce) {
      const id = requestAnimationFrame(finish);
      return () => cancelAnimationFrame(id);
    }

    const id = requestAnimationFrame(() => {
      el.dataset.landing = 'true'; // cross-fade hero -> dock layers
      el.style.transform = 'translate(0px, 0px) scale(1, 1)'; // release to identity
      if (dock) dock.style.transform = 'scale(1, 1)'; // release the counter-scale in sync
    });

    // The transform is the longest property; complete on its transitionend.
    const onEnd = (e: TransitionEvent) => {
      if (e.target === el && e.propertyName === 'transform') finish();
    };
    el.addEventListener('transitionend', onEnd);

    // Safety net: if transitionend never fires (interrupted paint), finish anyway.
    const fallback = window.setTimeout(finish, 700);

    return () => {
      cancelAnimationFrame(id);
      el.removeEventListener('transitionend', onEnd);
      window.clearTimeout(fallback);
    };
  }, [from, to, onDone]);

  return (
    <div
      ref={ref}
      className={styles.surface}
      style={{ left: to.left, top: to.top, width: to.width, height: to.height }}
      aria-hidden
    >
      {/* Hero layer: the modal's title bar + the big describe-box, hugging the
          surface bottom so the input lines up with the dock composer below. */}
      <div className={styles.heroLayer}>
        <div className={styles.heroHead}>
          <span className={styles.dot} />
          <span className={styles.bar} style={{ width: '34%' }} />
        </div>
        <div className={styles.heroFill} />
        <div className={styles.input}>
          <span className={styles.bar} style={{ width: '52%' }} />
        </div>
      </div>

      {/* Dock layer: the two-tab header + the composer at the bottom. Counter-scaled
          (see effect) so the landing Copilot content never stretches. */}
      <div className={styles.dockLayer} ref={dockRef}>
        <div className={styles.tabs}>
          <span className={styles.tab} data-active />
          <span className={styles.tab} />
        </div>
        <div className={styles.dockFill} />
        <div className={styles.composer}>
          <span className={styles.bar} style={{ width: '46%' }} />
        </div>
      </div>
    </div>
  );
}
