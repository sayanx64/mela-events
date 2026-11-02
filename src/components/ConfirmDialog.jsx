import { useEffect, useId, useRef } from 'react'

/**
 * Confirmation built on the native <dialog> element: focus is trapped, Escape closes it,
 * and the rest of the page is inert while it's open.
 */
export default function ConfirmDialog({ open, title, children, confirmLabel, cancelLabel = 'Keep it', onConfirm, onClose, danger = false }) {
  const ref = useRef(null)
  const titleId = useId()

  useEffect(() => {
    const dialog = ref.current
    if (!dialog) return
    if (open && !dialog.open) dialog.showModal()
    if (!open && dialog.open) dialog.close()
  }, [open])

  return (
    <dialog
      ref={ref}
      aria-labelledby={titleId}
      onClose={onClose}
      onClick={(e) => e.target === ref.current && onClose()}
      className="confirm-dialog m-auto w-[min(100%-2rem,28rem)] rounded-[20px] bg-surface p-0 text-fg"
    >
      <div className="p-7">
        <h2 id={titleId} className="display text-[2rem] leading-[0.95]">
          {title}
        </h2>
        <div className="mt-3 text-[1rem] leading-relaxed text-muted">{children}</div>
        <div className="mt-7 flex flex-wrap justify-end gap-2">
          <button type="button" className="btn btn-secondary" onClick={onClose} autoFocus>
            {cancelLabel}
          </button>
          <button
            type="button"
            className={`btn ${danger ? 'btn-danger' : 'btn-primary'}`}
            onClick={() => {
              onConfirm()
              onClose()
            }}
          >
            {confirmLabel}
          </button>
        </div>
      </div>
    </dialog>
  )
}
