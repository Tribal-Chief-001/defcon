// The shape of public/data/signals.json (built at ingest time by scripts/signals/build-signals.ts). Signals are context beside the conflict
// data: they never change a conflict number, a score or an index, and a fire is not proof of an attack.
export type SeismicSignal = { id: string; time: number; lat: number; lon: number; mag: number | null; type: string; place: string; url: string }; // time: unix seconds
export type DisasterSignal = { id: string; time: number; lat: number; lon: number; kind: string; alert: 'Orange' | 'Red'; title: string; country: string; url: string };
// detections of one 0.5-degree cell inside a conflict area during the last 24 hours (high or nominal confidence only)
export type FireCell = { lat: number; lon: number; count: number; frp: number; latestS: number; conflictId: string; conflict: string };
export type SignalSourceId = 'usgs' | 'gdacs' | 'firms';
export type SignalSource = { id: SignalSourceId; name: string; ok: boolean; count: number; fetchedS: number; licence: string; attribution: string; url: string; error?: string };
export type SignalsFile = { generated: string; windows: { seismicDays: number; disasterDays: number; fireHours: number }; sources: SignalSource[]; seismic: SeismicSignal[]; disasters: DisasterSignal[]; fires: FireCell[] };
