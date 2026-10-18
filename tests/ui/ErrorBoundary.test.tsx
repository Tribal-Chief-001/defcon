// @vitest-environment jsdom
import { cleanup, render, screen } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { errorLog } from '../../src/lib/errorLog';
import { ErrorBoundary } from '../../src/ui/ErrorBoundary';

const Boom = () => {
  throw new Error('render failed');
};
beforeEach(() => {
  errorLog.clear();
  vi.spyOn(console, 'error').mockImplementation(() => {}); // React logs caught render errors
});
afterEach(() => {
  cleanup();
  vi.restoreAllMocks();
});

describe('ErrorBoundary', () => {
  it('shows an inline message for a throwing child, records it, and keeps siblings rendered', () => {
    render(
      <div>
        <span>sibling</span>
        <ErrorBoundary where="dossier">
          <Boom />
        </ErrorBoundary>
      </div>,
    );
    expect(screen.getByText('sibling')).toBeTruthy();
    expect(screen.getByRole('alert').textContent).toMatch(/this panel failed/i);
    expect(errorLog.entries().map((e) => `${e.where}: ${e.message}`)).toEqual(['dossier: render failed']);
  });
  it('renders its children when nothing throws and does not touch the log', () => {
    render(<ErrorBoundary where="x"><span>fine</span></ErrorBoundary>);
    expect(screen.getByText('fine')).toBeTruthy();
    expect(errorLog.entries()).toEqual([]);
  });
  it('calls onReset (close the panel) from the fallback button', () => {
    let closed = 0;
    render(<ErrorBoundary where="x" onReset={() => closed++}><Boom /></ErrorBoundary>);
    screen.getByRole('button', { name: /close/i }).click();
    expect(closed).toBe(1);
  });
});
