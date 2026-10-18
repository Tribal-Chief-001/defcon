import type { TimelineFile } from '../../src/timeline/types';

export const timelineFixture = (): TimelineFile => ({
  generated: '2026-10-18',
  checkedAt: '2026-10-18',
  limits: 'Sources are mostly a few outlets.',
  theatres: [
    {
      key: 'ukraine',
      title: 'Russia - Ukraine',
      conflicts: ['russia-ukraine'],
      note: 'A note about the front line.',
      entries: [
        { date: '2026-03-01', title: 'A big strike hits <b>Kyiv</b>', summary: 'Ukraine said a missile and drone wave hit the capital.', status: 'confirmed', sources: [{ outlet: 'Reuters', title: 'Kyiv hit', url: 'https://www.reuters.com/a', published: '2026-03-01', verified: 'v' }, { outlet: 'BBC', title: 'Kyiv attack', url: 'https://www.bbc.com/b', published: '2026-03-02', verified: 'v' }] },
        { date: '2026-07-10', title: 'Talks stall', summary: 'Both sides gave different accounts of the talks.', status: 'disputed', sources: [{ outlet: 'AP', title: 'Talks', url: 'https://apnews.com/c', published: '2026-07-10', verified: 'v' }, { outlet: 'Guardian', title: 'Talks end', url: 'https://www.theguardian.com/d', published: '2026-07-11', verified: 'v' }] },
      ],
    },
    {
      key: 'gaza',
      title: 'Israel - Gaza',
      conflicts: ['israel-palestine'],
      entries: [{ date: '2026-09-01', title: 'Strikes despite ceasefire', summary: 'Israel said it struck militants.', status: 'reported', sources: [{ outlet: 'Al Jazeera', title: 'Strikes', url: 'https://www.aljazeera.com/e', published: '2026-09-01', verified: 'v' }] }],
    },
  ],
});
