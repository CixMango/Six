import { useEffect, useId, useRef, useState } from 'react';
import { MessageSquare, X } from 'lucide-react';

type Stage = 'writing' | 'sending' | 'sent' | 'failed';

/** Top right, next to Settings: a short message to the developer (delivered to their Discord through the website). */
export function FeedbackButton() {
  const dialog = useRef<HTMLDialogElement>(null);
  const [open, setOpen] = useState(false);
  const [message, setMessage] = useState('');
  const [contact, setContact] = useState('');
  const [stage, setStage] = useState<Stage>('writing');
  const [error, setError] = useState('');
  const titleId = useId();

  useEffect(() => {
    const d = dialog.current;
    if (!d) return;
    if (open && !d.open) d.showModal();
    if (!open && d.open) d.close();
  }, [open]);

  const close = () => {
    setOpen(false);
    if (stage === 'sent') {
      setMessage('');
      setContact('');
      setStage('writing');
    }
  };

  const send = async () => {
    setStage('sending');
    setError('');
    try {
      const res = await fetch('/api/feedback', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ message, contact, page: window.location.pathname }),
      });
      if (!res.ok) {
        const body = (await res.json().catch(() => ({}))) as { error?: string };
        throw new Error(body.error ?? `It didn't go through (${res.status}).`);
      }
      setStage('sent');
    } catch (e) {
      setStage('failed');
      setError((e as Error).message);
    }
  };

  return (
    <>
      <button type="button" className="feedback-button plate" aria-label="Send feedback" aria-haspopup="dialog" title="Send feedback" onClick={() => setOpen(true)}>
        <MessageSquare size={16} aria-hidden="true" />
      </button>
      <dialog
        ref={dialog}
        className="settings feedback plate"
        aria-labelledby={titleId}
        onClose={close}
        onClick={(e) => {
          if (e.target === e.currentTarget) close();
        }}
      >
        <div className="settings-body">
          <header className="settings-header">
            <h2 id={titleId} className="settings-title">Feedback</h2>
            <button type="button" className="settings-close" aria-label="Close feedback" onClick={close}>
              <X size={18} aria-hidden="true" />
            </button>
          </header>
          {stage === 'sent' ? (
            <>
              <p className="settings-note" role="status">Thanks! Your message was sent.</p>
              <button type="button" className="button is-primary" onClick={close}>Close</button>
            </>
          ) : (
            <form
              className="feedback-form"
              onSubmit={(e) => {
                e.preventDefault();
                if (message.trim() && stage !== 'sending') void send();
              }}
            >
              <div>
                <label className="field-label" htmlFor={`${titleId}-message`}>Bugs, ideas, anything</label>
                <textarea
                  id={`${titleId}-message`}
                  className="text-input feedback-text"
                  value={message}
                  maxLength={1500}
                  rows={6}
                  onChange={(e) => setMessage(e.target.value)}
                  placeholder="What happened, or what would make Six better?"
                />
              </div>
              <div>
                <label className="field-label" htmlFor={`${titleId}-contact`}>How to reach you (optional)</label>
                <input
                  id={`${titleId}-contact`}
                  className="text-input"
                  value={contact}
                  maxLength={100}
                  onChange={(e) => setContact(e.target.value)}
                  placeholder="Discord name or email, if you'd like a reply"
                  autoComplete="off"
                />
              </div>
              {stage === 'failed' && <p className="error-text" role="alert">{error}</p>}
              <button type="submit" className="button is-primary" disabled={!message.trim() || stage === 'sending'}>
                {stage === 'sending' ? 'Sending...' : 'Send'}
              </button>
            </form>
          )}
        </div>
      </dialog>
    </>
  );
}
