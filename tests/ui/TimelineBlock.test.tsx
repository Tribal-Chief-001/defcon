// @vitest-environment jsdom
import { cleanup, render, screen, within } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { fireEvent } from '@testing-library/react';
import { TimelineBlock, type TimelineRow } from '../../src/ui/TimelineBlock';
import { timelineFixture } from '../timeline/fixture';

afterEach(cleanup);
const rows = (): TimelineRow[] => timelineFixture().theatres.flatMap((t) => t.entries.map((entry) => ({ entry, theatre: t.title })));
const pinned = (): TimelineRow[] => rows().map((r, i) => ({ ...r, pinIndex: r.entry.at ? i : undefined }));

describe('TimelineBlock', () => {
  it('lists entries newest first with date, title, status word and summary', () => {
    render(<TimelineBlock rows={rows()} checkedAt="2026-10-18" />);
    const items = within(screen.getByRole('list', { name: /key events/i })).getAllByRole('listitem');
    expect(items.map((i) => /(\d{1,2} \w{3} 2026)/.exec(i.textContent ?? '')![1])).toEqual(['1 Sep 2026', '10 Jul 2026', '1 Mar 2026']);
    expect(items[0]!.textContent).toMatch(/reported/i);
    expect(items[1]!.textContent).toMatch(/disputed/i);
    expect(items[2]!.textContent).toMatch(/confirmed/i);
    expect(items[1]!.textContent).toMatch(/Both sides gave different accounts/);
  });

  it('says it was checked on a date and explains the statuses', () => {
    render(<TimelineBlock rows={rows()} checkedAt="2026-10-18" />);
    const t = screen.getByRole('region', { name: /key events/i }).textContent ?? '';
    expect(t).toMatch(/checked 18 Oct 2026/i);
    expect(t).toMatch(/confirmed.*two independent outlets report the event/i);
    expect(t).toMatch(/not verified/i); // figures and claims are attributed, not verified
    expect(t).toMatch(/reported.*one source/i);
    expect(t).toMatch(/disputed/i);
  });

  it('links every source over https with rel=noopener noreferrer and opens it in a new tab', () => {
    render(<TimelineBlock rows={rows()} checkedAt="2026-10-18" />);
    const links = screen.getAllByRole('link');
    expect(links.map((l) => l.textContent)).toEqual(expect.arrayContaining(['Reuters', 'BBC', 'AP', 'Guardian', 'Al Jazeera']));
    for (const l of links) {
      expect(l.getAttribute('href')).toMatch(/^https:\/\//);
      expect(l.getAttribute('rel')).toBe('noopener noreferrer');
      expect(l.getAttribute('target')).toBe('_blank');
    }
  });

  it('renders data text as text, never as markup', () => {
    const { container } = render(<TimelineBlock rows={rows()} checkedAt="2026-10-18" />);
    expect(container.querySelector('b')).toBeNull();
    expect(container.textContent).toContain('A big strike hits <b>Kyiv</b>');
  });

  it('shows the theatre tag only when asked, and honours a limit', () => {
    const { rerender } = render(<TimelineBlock rows={rows()} checkedAt="2026-10-18" />);
    expect(screen.getByRole('region', { name: /key events/i }).textContent).not.toMatch(/Israel - Gaza/);
    rerender(<TimelineBlock rows={rows()} checkedAt="2026-10-18" showTheatre limit={2} />);
    const items = screen.getAllByRole('listitem');
    expect(items).toHaveLength(2);
    expect(items[0]!.textContent).toMatch(/Israel - Gaza/);
  });

  it('renders nothing for no rows', () => {
    const { container } = render(<TimelineBlock rows={[]} checkedAt="2026-10-18" />);
    expect(container.textContent).toBe('');
  });

  it('shows the data limits and the notes of the theatres on the page', () => {
    render(<TimelineBlock rows={rows()} checkedAt="2026-10-18" limits="Mostly Al Jazeera and Times of Israel." notes={['Front-line changes are not listed.']} />);
    const t = screen.getByRole('region', { name: /key events/i }).textContent ?? '';
    expect(t).toMatch(/Mostly Al Jazeera and Times of Israel\./);
    expect(t).toMatch(/Front-line changes are not listed\./);
  });
  it('gives each source link a name that says what it is and that it opens a new tab', () => {
    render(<TimelineBlock rows={rows()} checkedAt="2026-10-18" />);
    expect(screen.getByRole('link', { name: /Reuters: Kyiv hit .*new tab/i })).toBeTruthy();
  });

  it('offers "Show on the map" only for entries with a place, and reports the place', () => {
    const onShow = vi.fn();
    render(<TimelineBlock rows={pinned()} checkedAt="2026-10-18" onShowOnMap={onShow} />);
    const btns = screen.getAllByRole('button', { name: /show on the map/i });
    expect(btns).toHaveLength(2); // Kyiv and Rafah have a place, the July entry has none
    fireEvent.click(btns[0]!);
    expect(onShow).toHaveBeenCalledWith({ lat: 31.3, lon: 34.25, place: 'Rafah' }, 0 + 2); // the newest entry first: Rafah, pin index 2
  });
  it('tells the globe which pin a hovered or focused entry is, and clears it on leave', () => {
    const onHover = vi.fn();
    render(<TimelineBlock rows={pinned()} checkedAt="2026-10-18" onHoverPin={onHover} />);
    const items = screen.getAllByRole('listitem');
    fireEvent.mouseEnter(items[0]!);
    expect(onHover).toHaveBeenLastCalledWith(2);
    fireEvent.mouseLeave(items[0]!);
    expect(onHover).toHaveBeenLastCalledWith(null);
    fireEvent.mouseEnter(items[1]!); // the July entry has no place: no pin to highlight
    expect(onHover).toHaveBeenLastCalledWith(null);
  });
  it('marks a highlighted entry (clicked on the chart) and scrolls it into view', () => {
    const scroll = vi.fn();
    Element.prototype.scrollIntoView = scroll;
    const r = rows();
    render(<TimelineBlock rows={r} checkedAt="2026-10-18" highlight={`${r[0]!.entry.date}|${r[0]!.entry.title}`} />);
    const li = screen.getAllByRole('listitem').find((x) => x.getAttribute('data-highlight') === 'true');
    expect(li).toBeTruthy();
    expect(li!.textContent).toContain('A big strike hits');
    expect(scroll).toHaveBeenCalled();
  });
  it('conveys the status in words, not only by the colour of the node', () => {
    render(<TimelineBlock rows={rows()} checkedAt="2026-10-18" />);
    for (const w of ['confirmed', 'reported', 'disputed']) expect(screen.getAllByText(new RegExp(`^${w}$`, 'i')).length).toBeGreaterThan(0);
  });
});
