import type {Loader, LoaderWithParser} from '@loaders.gl/loader-utils';
import type {FourwingsLoaderOptions, FourwingsOptions} from './lib/types';
import {parseFourwings} from './lib/parse-fourwings';

// __VERSION__ is injected by babel-plugin-version-inline
// @ts-ignore TS2304: Cannot find name '__VERSION__'.
const VERSION = typeof __VERSION__ !== 'undefined' ? __VERSION__ : 'latest';

/**
 * Worker loader for the 4wings tile format
 */
export const FourwingsWorkerLoader: Loader<
  any, // BinaryFeatureCollection | GeoJSONTable | Feature<Geometry, GeoJsonProperties>,
  never,
  FourwingsLoaderOptions
> = {
  name: 'fourwings tiles',
  id: 'fourwings',
  module: 'fourwings',
  version: VERSION,
  // Note: ArcGIS uses '.pbf' extension and 'application/octet-stream'
  extensions: ['pbf'],
  mimeTypes: ['application/x-protobuf', 'application/octet-stream', 'application/protobuf'],
  worker: true,
  category: 'geometry',
  options: {
    fourwings: {} as FourwingsOptions
  } as FourwingsLoaderOptions
};

/**
 * Loader for the 4wings tile format
 */
export const FourwingsLoader: LoaderWithParser<
  any, // BinaryFeatureCollection | GeoJSONTable | Feature<Geometry, GeoJsonProperties>,
  never,
  FourwingsLoaderOptions
> = {
  ...FourwingsWorkerLoader,
  parse: async (arrayBuffer, options = {} as FourwingsLoaderOptions) =>
    parseFourwings(arrayBuffer, options),
  parseSync: async (arrayBuffer, options = {} as FourwingsLoaderOptions) =>
    parseFourwings(arrayBuffer, options),
  binary: true
};
