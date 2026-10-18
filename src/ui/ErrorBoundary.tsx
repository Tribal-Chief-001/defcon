import { Component, type ReactNode } from 'react';
import { errorLog } from '../lib/errorLog';

type Props = { where: string; children: ReactNode; onReset?: () => void; fallback?: ReactNode };

// A render error in one panel must not blank the globe: it shows a small inline message, records the error locally and offers to close.
export class ErrorBoundary extends Component<Props, { failed: boolean }> {
  state = { failed: false };
  static getDerivedStateFromError() {
    return { failed: true };
  }
  componentDidCatch(error: unknown) {
    errorLog.record(error, this.props.where);
  }
  render() {
    if (!this.state.failed) return this.props.children;
    if (this.props.fallback !== undefined) return this.props.fallback;
    return (
      <div role="alert" className="pointer-events-auto absolute left-[4vw] top-[7rem] z-10 rounded-[24px] border border-[var(--orange)] bg-black/70 p-4 font-[var(--font-mono)] text-[11px] uppercase tracking-[0.12em] text-[var(--orange)]">
        This panel failed. Close it and try again.
        <button
          type="button"
          onClick={() => {
            this.setState({ failed: false });
            this.props.onReset?.();
          }}
          className="ml-3 rounded-full border border-[var(--orange)] px-2 py-0.5"
        >
          Close
        </button>
      </div>
    );
  }
}
