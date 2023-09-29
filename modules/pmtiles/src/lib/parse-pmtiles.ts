import {Source, PMTiles, Header, TileType} from 'pmtiles';

/** Metadata describing a PMTiles file */
export type PMTilesMetadata = {
  /** Name of the tileset (extracted from JSON metadata if available) */
  name?: string;
  /** Attribution string (extracted from JSON metadata if available) */
  attributions?: string[];

  format: 'pmtiles';
  /** Version of pm tiles format used by this tileset */
  formatVersion: number;
  /** PMTiles format specific header */
  formatHeader?: Header;
  /** MIME type for tile contents. Unknown tile types will return 'application/octet-stream */
  mimeType:
    | 'application/vnd.mapbox-vector-tile'
    | 'image/png'
    | 'image/jpeg'
    | 'image/webp'
    | 'image/avif'
    | 'application/octet-stream';
  /** The original numeric tile type constant specified in the PMTiles tileset */
  tileType: TileType;
  /** Minimal zoom level of tiles in this tileset */
  minZoom: number;
  /** Maximal zoom level of tiles in this tileset */
  maxZoom: number;
  /** Bounding box of tiles in this tileset `[[w, s], [e, n]]`  */
  boundingBox: [min: [x: number, y: number], max: [x: number, y: number]];
  /** Center long, lat of this tileset */
  center: [number, number];
  /** Center zoom level of this tileset */
  centerZoom: number;
  /** Cache tag */
  etag?: string;
  /** Current assumption is that this is a tileJSON style metadata generated by e.g. tippecanoe */
  jsonMetadata?: Record<string, unknown>;
};

export type ParsePMTilesOptions = {
  tileZxy?: [number, number, number];
};

export async function loadPMTilesHeader(source: Source): Promise<PMTilesMetadata> {
  const pmTiles = new PMTiles(source);
  const header = await pmTiles.getHeader();
  const metadata = await pmTiles.getMetadata();
  const jsonMetadata =
    metadata && typeof metadata === 'object' && !Array.isArray(metadata)
      ? (metadata as Record<string, unknown>)
      : null;
  return parsePMTilesHeader(header, jsonMetadata);
}

export async function loadPMTile(
  source: Source,
  options: ParsePMTilesOptions
): Promise<ArrayBuffer | undefined> {
  const pmTiles = new PMTiles(source);
  if (!options.tileZxy) {
    throw new Error('tile zxy missing');
  }
  const [z, x, y] = options.tileZxy;
  const tile = await pmTiles.getZxy(z, x, y);
  return tile?.data;
}

export function parsePMTilesHeader(
  header: Header,
  jsonMetadata: Record<string, unknown> | null
): PMTilesMetadata {
  const metadata: PMTilesMetadata = {
    format: 'pmtiles',
    formatVersion: header.specVersion,
    formatHeader: header,
    mimeType: decodeTileType(header.tileType),
    tileType: header.tileType,
    minZoom: header.minZoom,
    maxZoom: header.maxZoom,
    boundingBox: [
      [header.minLon, header.minLat],
      [header.maxLon, header.maxLat]
    ],
    center: [header.centerLon, header.centerLat],
    centerZoom: header.centerZoom,
    etag: header.etag
  };

  if (jsonMetadata) {
    metadata.jsonMetadata = jsonMetadata;
  }

  if (typeof jsonMetadata?.name === 'string') {
    metadata.name = jsonMetadata.name;
  }

  if (typeof jsonMetadata?.attribution === 'string') {
    metadata.attributions = [jsonMetadata.attribution];
  }

  return metadata;
}

/** Extract a MIME type for tiles from vector tile header  */
function decodeTileType(
  tileType: TileType
):
  | 'application/vnd.mapbox-vector-tile'
  | 'image/png'
  | 'image/jpeg'
  | 'image/webp'
  | 'image/avif'
  | 'application/octet-stream' {
  switch (tileType) {
    case TileType.Mvt:
      return 'application/vnd.mapbox-vector-tile';
    case TileType.Png:
      return 'image/png';
    case TileType.Jpeg:
      return 'image/jpeg';
    case TileType.Webp:
      return 'image/webp';
    case TileType.Avif:
      return 'image/avif';
    default:
      return 'application/octet-stream';
  }
}
