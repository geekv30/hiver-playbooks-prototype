'use client';

import { useLayoutEffect, useRef } from 'react';

// Editable playbook title - a content-sized span so the dotted underline hugs the
// text exactly (an <input> sized by char-count overshoots a proportional font).
// Uncontrolled DOM text (seeded/reconciled imperatively) so the caret never jumps.
// One renderer; the caller supplies the className for its context (top bar / canvas
// header).
export default function TitleField({
  value,
  onChange,
  className,
}: {
  value: string;
  onChange: (t: string) => void;
  className?: string;
}) {
  const ref = useRef<HTMLSpanElement>(null);
  // "Unnamed" until the user gives it a real title: subtle + underlined as a
  // "name me" affordance; once named, normal ink with no underline.
  const unnamed = !value.trim() || value === 'Untitled AOP';
  useLayoutEffect(() => {
    const el = ref.current;
    if (el && el.textContent !== value) el.textContent = value;
  }, [value]);
  return (
    <span
      ref={ref}
      className={className}
      data-unnamed={unnamed || undefined}
      contentEditable
      suppressContentEditableWarning
      spellCheck={false}
      role="textbox"
      aria-multiline="false"
      aria-label="AOP title"
      onInput={(e) => onChange(e.currentTarget.textContent ?? '')}
      onKeyDown={(e) => {
        if (e.key === 'Enter') {
          e.preventDefault();
          e.currentTarget.blur();
        }
      }}
    />
  );
}
