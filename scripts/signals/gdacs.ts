import type { DisasterSignal } from '../../src/signals/types';

// Humanitarian disaster alerts (earthquake, cyclone, flood, wildfire, drought, volcano) at Orange or Red level from the GDACS RSS feed.
// The feed carries "Copyright notice: European Union (CC BY 4.0), reuse is allowed, provided appropriate credit to GDACS is given".
const ENT: Record<string, string> = { '&amp;': '&', '&lt;': '<', '&gt;': '>', '&quot;': '"', '&#39;': "'", '&apos;': "'" };
const decode = (s: string) => s.replace(/&(amp|lt|gt|quot|apos|#39);/g, (m) => ENT[m] ?? m);
const tag = (item: string, name: string): string => {
  const m = new RegExp(`<${name}(?:\\s[^>]*)?>([\\s\\S]*?)</${name}>`).exec(item);
  return m ? decode(m[1]!.replace(/^\s*<!\[CDATA\[|\]\]>\s*$/g, '').trim()) : '';
};

export function parseGdacsRss(xml: string): DisasterSignal[] {
  if (!/<rss[\s>]/.test(xml)) return []; // an HTML error page or garbage is not a feed
  const out: DisasterSignal[] = [];
  for (const m of xml.matchAll(/<item>[\s\S]*?<\/item>/g)) {
    const item = m[0];
    const alert = tag(item, 'gdacs:alertlevel');
    const kind = tag(item, 'gdacs:eventtype');
    const eventId = tag(item, 'gdacs:eventid');
    const lat = Number(tag(item, 'geo:lat'));
    const lon = Number(tag(item, 'geo:long'));
    const time = Date.parse(tag(item, 'gdacs:fromdate') || tag(item, 'pubDate')) / 1000;
    if ((alert !== 'Orange' && alert !== 'Red') || !/^[A-Z]{2}$/.test(kind) || !/^\d{1,12}$/.test(eventId) || !Number.isFinite(lat) || !Number.isFinite(lon) || Math.abs(lat) > 90 || Math.abs(lon) > 180 || !Number.isFinite(time)) continue;
    const link = tag(item, 'link');
    out.push({
      id: `${kind}${eventId}`,
      time: Math.round(time),
      lat,
      lon,
      kind,
      alert,
      title: tag(item, 'title').slice(0, 160),
      country: tag(item, 'gdacs:country').slice(0, 80),
      url: /^https:\/\/www\.gdacs\.org\//.test(link) ? link : `https://www.gdacs.org/report.aspx?eventtype=${kind}&eventid=${eventId}`,
    });
  }
  return out;
}
