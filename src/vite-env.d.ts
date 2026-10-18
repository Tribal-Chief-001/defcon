/// <reference types="vite/client" />

interface ImportMetaEnv {
  /** Where the event snapshot is served from: a same-origin path or an https URL (default /data/events). */
  readonly VITE_EVENTS_BASE?: string;
}
