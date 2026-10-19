// @vitest-environment jsdom
import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { CommandPalette } from '../../src/ui/CommandPalette';
import type { CountryIndexEntry } from '../../src/dossier/types';

const e = (id: string, name: string, iso3: string, capitals: string[] = []): CountryIndexEntry => ({ id, name, iso2: null, iso3, capitals, continent: null, lat: 0, lon: 0, hasPolygon: true });
const index = [e('IND', 'India', 'IND', ['New Delhi']), e('IDN', 'Indonesia', 'IDN', ['Jakarta']), e('FRA', 'France', 'FRA', ['Paris']), e('BAD', '<img src=x onerror=alert(1)>', 'BAD')];

afterEach(cleanup);
const open = () => fireEvent.keyDown(window, { key: 'k', ctrlKey: true });
const input = () => screen.getByRole('combobox') as HTMLInputElement;

describe('CommandPalette: the shortcut listener (finding: a real Ctrl+K sometimes did not open it)', () => {
  it('registers the window keydown listener once and keeps it across re-renders, instead of removing and re-adding it on every render', () => {
    const add = vi.spyOn(window, 'addEventListener');
    const remove = vi.spyOn(window, 'removeEventListener');
    const { rerender, unmount } = render(<CommandPalette index={index} onPick={() => {}} />);
    open();
    fireEvent.keyDown(window, { key: 'k', ctrlKey: true });
    rerender(<CommandPalette index={index.slice(0, 2)} onPick={() => {}} />);
    open();
    const keydowns = (spy: { mock: { calls: unknown[][] } }) => spy.mock.calls.filter((c) => c[0] === 'keydown').length;
    expect(keydowns(add)).toBe(1);
    expect(keydowns(remove)).toBe(0);
    expect(screen.getByRole('dialog')).toBeTruthy(); // and it still toggles with the latest state
    unmount();
    expect(keydowns(remove)).toBe(1);
    add.mockRestore();
    remove.mockRestore();
  });
});

describe('CommandPalette: with another dialog open (Plan 8 review minor)', () => {
  it('does not open on top of another dialog', () => {
    render(
      <>
        <div role="dialog" aria-label="About and sources" />
        <CommandPalette index={index} onPick={() => {}} />
      </>,
    );
    open();
    expect(screen.queryByRole('dialog', { name: /search countries/i })).toBeNull();
  });
});

describe('CommandPalette', () => {
  it('opens with Ctrl+K and with Cmd+K, focuses the input, and closes with Esc', () => {
    render(<CommandPalette index={index} onPick={() => {}} />);
    expect(screen.queryByRole('dialog')).toBeNull();
    open();
    expect(screen.getByRole('dialog')).toBeTruthy();
    expect(document.activeElement).toBe(input());
    fireEvent.keyDown(input(), { key: 'Escape' });
    expect(screen.queryByRole('dialog')).toBeNull();
    fireEvent.keyDown(window, { key: 'K', metaKey: true });
    expect(screen.getByRole('dialog')).toBeTruthy();
  });
  it('returns focus to the previously focused element on close', () => {
    render(<><button>before</button><CommandPalette index={index} onPick={() => {}} /></>);
    const b = screen.getByText('before');
    b.focus();
    open();
    fireEvent.keyDown(input(), { key: 'Escape' });
    expect(document.activeElement).toBe(b);
  });
  it('returns focus to the previously focused element after picking a result', () => {
    render(<><button>before</button><CommandPalette index={index} onPick={() => {}} /></>);
    const b = screen.getByText('before');
    b.focus();
    open();
    fireEvent.change(input(), { target: { value: 'fran' } });
    fireEvent.keyDown(input(), { key: 'Enter' });
    expect(screen.queryByRole('dialog')).toBeNull();
    expect(document.activeElement).toBe(b);
  });
  // keyboard: the dialog holds one focusable element, so Tab must not escape to the page behind it
  it('keeps focus on the search field when Tab or Shift+Tab is pressed', () => {
    render(<CommandPalette index={index} onPick={() => {}} />);
    open();
    expect(document.activeElement).toBe(input());
    const tab = fireEvent.keyDown(input(), { key: 'Tab' });
    expect(tab).toBe(false); // preventDefault was called
    const shiftTab = fireEvent.keyDown(input(), { key: 'Tab', shiftKey: true });
    expect(shiftTab).toBe(false);
    expect(document.activeElement).toBe(input());
  });
  it('has a visible button for touch users', () => {
    render(<CommandPalette index={index} onPick={() => {}} />);
    fireEvent.click(screen.getByRole('button', { name: /search/i }));
    expect(screen.getByRole('dialog')).toBeTruthy();
  });
  it('filters as you type, moves with ArrowDown/ArrowUp, and picks with Enter', () => {
    const onPick = vi.fn();
    render(<CommandPalette index={index} onPick={onPick} />);
    open();
    fireEvent.change(input(), { target: { value: 'ind' } });
    const opts = screen.getAllByRole('option');
    expect(opts.length).toBe(2);
    expect(opts[0]!.getAttribute('aria-selected')).toBe('true');
    expect(input().getAttribute('aria-activedescendant')).toBe(opts[0]!.id);
    fireEvent.keyDown(input(), { key: 'ArrowDown' });
    expect(screen.getAllByRole('option')[1]!.getAttribute('aria-selected')).toBe('true');
    expect(input().getAttribute('aria-activedescendant')).toBe(screen.getAllByRole('option')[1]!.id);
    fireEvent.keyDown(input(), { key: 'ArrowUp' });
    fireEvent.keyDown(input(), { key: 'Enter' });
    expect(onPick).toHaveBeenCalledWith('IND');
    expect(screen.queryByRole('dialog')).toBeNull();
  });
  it('picks by clicking a result', () => {
    const onPick = vi.fn();
    render(<CommandPalette index={index} onPick={onPick} />);
    open();
    fireEvent.change(input(), { target: { value: 'paris' } });
    fireEvent.click(screen.getByRole('option'));
    expect(onPick).toHaveBeenCalledWith('FRA');
  });
  it('shows "No match" for a query without results and does not pick on Enter', () => {
    const onPick = vi.fn();
    render(<CommandPalette index={index} onPick={onPick} />);
    open();
    fireEvent.change(input(), { target: { value: 'zzzz' } });
    expect(screen.getByText(/no match/i)).toBeTruthy();
    expect(input().getAttribute('aria-expanded')).toBe('false');
    fireEvent.keyDown(input(), { key: 'Enter' });
    expect(onPick).not.toHaveBeenCalled();
  });
  it('does not pick while an IME composition is in progress', () => {
    const onPick = vi.fn();
    render(<CommandPalette index={index} onPick={onPick} />);
    open();
    fireEvent.change(input(), { target: { value: 'ind' } });
    fireEvent.compositionStart(input());
    fireEvent.keyDown(input(), { key: 'Enter' });
    expect(onPick).not.toHaveBeenCalled();
    fireEvent.compositionEnd(input());
    fireEvent.keyDown(input(), { key: 'Enter' });
    expect(onPick).toHaveBeenCalledWith('IND');
  });
  it('renders names as text, never as HTML', () => {
    render(<CommandPalette index={index} onPick={() => {}} />);
    open();
    fireEvent.change(input(), { target: { value: 'img' } });
    expect(document.querySelector('img')).toBeNull();
    expect(screen.getByRole('option').textContent).toContain('<img src=x onerror=alert(1)>');
  });
  it('starts with an empty query each time it opens', () => {
    render(<CommandPalette index={index} onPick={() => {}} />);
    open();
    fireEvent.change(input(), { target: { value: 'fra' } });
    fireEvent.keyDown(input(), { key: 'Escape' });
    open();
    expect(input().value).toBe('');
    expect(screen.queryAllByRole('option')).toHaveLength(0);
  });
});
