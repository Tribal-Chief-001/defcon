import { useMemo, useState } from 'react';
import type { Conflict, ConflictsFile } from '../../conflicts/types';
import type { TimelineFile } from '../../timeline/types';
import { RangeBar } from '../../viz/RangeBar';
import { StreamChart } from '../../viz/StreamChart';
import { useCountUp } from '../../viz/useCountUp';
import { TimelineBlock, type TimelineRow } from '../TimelineBlock';
import { rowKey } from './pins';
import { EventList } from './EventList';
import type { PlaceHandler } from './Overview';
import { entriesFor, pinnedRows } from './pins';
import { date, int, label, Section, span, TREND } from './parts';

const KIND_NAME = { state: 'State-based', 'non-state': 'Non-state', 'one-sided': 'One-sided' } as const;

function Window({ title, r, events, to, max }: { title: string; r: Conflict['deaths']['d30']; events: number; to: string; max: number }) {
  const v = useCountUp(r.best);
  return (
    <div className="border-t border-[var(--border)] pt-3">
      <span className={label}>{title}</span>
      <span className="mt-1 block font-[var(--font-body)] text-[34px] font-semibold leading-none tracking-tight">{int(v)}</span>
      <span className="mt-2 block">
        <RangeBar low={r.low} best={r.best} high={r.high} max={max} />
      </span>
      <span className="mt-1 block font-[var(--font-mono)] text-[11.5px] text-[var(--text-muted)]">range {span(r)}</span>
      <span className="block font-[var(--font-mono)] text-[11.5px] text-[var(--text-muted)]">
        {int(events)} events, to {date(to)}
      </span>
    </div>
  );
}

// One conflict: the three windows with their ranges, the weekly deaths with the key events on the same axis, who is involved, the
// editorial timeline (with "show on the map") and the latest events. Pins on the globe follow the timeline entries that have a place.
export function ConflictView({ c, f, tl, onBack, onDive, onFocusPlace, onHoverPin }: { c: Conflict; f: ConflictsFile; tl: TimelineFile | null | undefined; onBack: () => void; onDive: (id: string) => void; onFocusPlace: PlaceHandler; onHoverPin: (i: number | null) => void }) {
  const [highlight, setHighlight] = useState<string | undefined>();
  const mine = (tl?.theatres ?? []).filter((t) => t.conflicts.includes(c.id));
  const all = useMemo(() => entriesFor(tl, c.id), [tl, c.id]);
  const pins = useMemo(() => pinnedRows(all), [all]);
  const rows: TimelineRow[] = all.map((r) => ({ ...r, pinIndex: r.entry.at ? pins.indexOf(r) : undefined }));
  const max = Math.max(1, c.deaths.d365.high);
  const share = c.countries.reduce((s, k) => s + k.deaths365, 0) || 1;
  const placedPct = c.geo ? Math.round(c.geo.locatedShare * 100) : null;

  return (
    <div>
      <button type="button" onClick={onBack} className="mt-5 font-[var(--font-mono)] text-[11.5px] uppercase tracking-[0.15em] text-[var(--text-muted)] hover:text-[var(--lime)]">
        {'←'} World overview
      </button>
      <h3 className="mt-3 font-[var(--font-display)] text-[clamp(30px,5vw,44px)] font-extrabold leading-[1.05] tracking-tight">{c.name}</h3>
      <p className={`${label} mt-3`}>
        {c.kinds.map((k) => KIND_NAME[k]).join(' · ')} · activity trend <span className={TREND[c.trend]}>{c.trend}</span> · last event {date(c.lastDate)}
        {c.provisionalShare > 0 ? ` · ${Math.round(c.provisionalShare * 100)}% provisional` : ''}
      </p>

      <div className="mt-6 grid grid-cols-1 gap-5 sm:grid-cols-3">
        <Window title="Last 30 days" r={c.deaths.d30} events={c.events.d30} to={f.dataEnd} max={max} />
        <Window title="Last 90 days" r={c.deaths.d90} events={c.events.d90} to={f.dataEnd} max={max} />
        <Window title="Last 365 days" r={c.deaths.d365} events={c.events.d365} to={f.dataEnd} max={max} />
      </div>

      <Section title="Deaths per week, with the key events" note="Best-estimate deaths per week from a zero baseline. The dots are key events of the timeline: click one to find its card; events after the data end sit in the shaded band.">
        <StreamChart
          layers={[{ key: 'deaths', name: 'Deaths per week', values: c.weekly, fill: 'var(--lime)', opacity: 0.75 }]}
          dataEnd={f.dataEnd}
          label="Deaths per week in this conflict"
          events={rows.map((r) => ({ date: r.entry.date, title: r.entry.title, status: r.entry.status }))}
          onEventClick={(i) => {
            const r = rows[i];
            if (!r) return;
            setHighlight(rowKey(r.entry));
            if (r.entry.at) onFocusPlace(r.entry.at);
          }}
          onEventHover={(i) => onHoverPin(i === null ? null : (rows[i]?.pinIndex ?? null))}
        />
      </Section>

      <Section title="Countries in the data">
        <div className="mb-3 flex h-[8px] w-full overflow-hidden rounded-full border border-[var(--border)]" aria-hidden="true">
          {c.countries.slice(0, 8).map((k, i) => (
            <span key={`${k.id}-${k.name}`} style={{ width: `${(k.deaths365 / share) * 100}%`, background: i === 0 ? 'var(--lime)' : 'var(--text)', opacity: i === 0 ? 0.8 : Math.max(0.15, 0.5 - i * 0.06) }} />
          ))}
        </div>
        <ul aria-label="Countries in the data" className="flex flex-wrap gap-2">
          {c.countries.slice(0, 12).map((k) => (
            <li key={`${k.id}-${k.name}`}>
              {k.id ? (
                <button type="button" onClick={() => onDive(k.id!)} className="rounded-full border border-[var(--border-strong)] px-3 py-1 font-[var(--font-mono)] text-[12px] hover:text-[var(--lime)]">
                  {k.name} <span className="text-[var(--text-muted)]">{int(k.deaths365)}</span>
                </button>
              ) : (
                <span className="rounded-full border border-[var(--border)] px-3 py-1 font-[var(--font-mono)] text-[12px] text-[var(--text-muted)]">
                  {k.name} {int(k.deaths365)}
                </span>
              )}
            </li>
          ))}
        </ul>
        {placedPct !== null ? (
          <p className="mt-3 max-w-[62ch] text-[13px] text-[var(--text-muted)]">
            {c.geo!.locatedShare < 0.5 ? `Only ${placedPct}% of the deaths could be placed on the map (UCDP gives the rest only a region or country location), so the globe shows where the located events are.` : `${placedPct}% of the deaths are located on the map.`}
          </p>
        ) : null}
      </Section>

      <div className="mt-10">
        {tl === null ? (
          <p className="text-[14px] text-[var(--text-muted)]">Timeline unavailable.</p>
        ) : mine.length > 0 && tl ? (
          <TimelineBlock rows={rows} checkedAt={tl.checkedAt} limits={tl.limits} notes={mine.flatMap((t) => (t.note ? [t.note] : []))} highlight={highlight} onShowOnMap={(at) => onFocusPlace(at)} onHoverPin={onHoverPin} />
        ) : null}
      </div>

      <Section title={`Latest events in the data, to ${date(f.dataEnd)}`}>
        <EventList events={c.latest} />
      </Section>
    </div>
  );
}
