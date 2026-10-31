"use client";

import { useEffect, useId, useRef } from "react";

interface DialogProps {
  open: boolean;
  onClose: () => void;
  title: string;
  returnFocusTo?: string;
  className?: string;
  children: React.ReactNode;
  align?: "center" | "right";
}

export function Dialog({
  open,
  onClose,
  title,
  returnFocusTo,
  className = "",
  children,
  align = "center",
}: DialogProps) {
  const ref = useRef<HTMLDialogElement>(null);
  const titleId = useId();

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    if (open && !el.open) {
      el.showModal();
    } else if (!open && el.open) {
      el.close();
    }
  }, [open]);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const handleClose = () => {
      onClose();
      if (returnFocusTo) document.getElementById(returnFocusTo)?.focus();
    };
    el.addEventListener("close", handleClose);
    return () => el.removeEventListener("close", handleClose);
  }, [onClose, returnFocusTo]);

  return (
    <dialog
      ref={ref}
      className={`ui-dialog ui-dialog--${align} ${className}`}
      aria-labelledby={titleId}
      onCancel={(e) => {
        e.preventDefault();
        onClose();
      }}
      onClick={(e) => {
        // click on the ::backdrop reports the dialog itself as target
        if (e.target === ref.current) onClose();
      }}
    >
      <div className="ui-dialog__inner">
        <h2 id={titleId} className="ui-dialog__title">
          {title}
        </h2>
        <button
          type="button"
          className="ui-dialog__close"
          onClick={onClose}
          aria-label={`Close ${title}`}
        >
          <svg className="icon" aria-hidden="true">
            <use href="#icon-close" />
          </svg>
        </button>
        {children}
      </div>
    </dialog>
  );
}
