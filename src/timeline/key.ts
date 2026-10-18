import type { TimelineEntry } from './types';

// identifies an entry on a chart and in the list (a date and a title are unique within the file)
export const rowKey = (e: TimelineEntry) => `${e.date}|${e.title}`;
