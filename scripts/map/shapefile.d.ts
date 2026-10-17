declare module 'shapefile' {
  import type { FeatureCollection } from 'geojson';
  export function read(shp: string, dbf?: string): Promise<FeatureCollection>;
}
