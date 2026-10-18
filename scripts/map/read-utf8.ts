import { read } from 'shapefile';

// Natural Earth dbf text is UTF-8, but the library decodes windows-1252 unless told otherwise (its types omit the option).
type ReadWithOptions = (shp: string, dbf: string, options: { encoding: string }) => ReturnType<typeof read>;
export const readUtf8 = (shpPath: string, dbfPath: string) => (read as unknown as ReadWithOptions)(shpPath, dbfPath, { encoding: 'utf-8' });
