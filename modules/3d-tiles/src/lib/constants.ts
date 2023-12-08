// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright vis.gl contributors

// TILE TYPES

export const TILE3D_TYPE = {
  COMPOSITE: 'cmpt',
  POINT_CLOUD: 'pnts',
  BATCHED_3D_MODEL: 'b3dm',
  INSTANCED_3D_MODEL: 'i3dm',
  GEOMETRY: 'geom',
  VECTOR: 'vect',
  GLTF: 'glTF'
};

export const TILE3D_TYPES = Object.keys(TILE3D_TYPE);

export const MAGIC_ARRAY = {
  BATCHED_MODEL: [98, 51, 100, 109],
  INSTANCED_MODEL: [105, 51, 100, 109],
  POINT_CLOUD: [112, 110, 116, 115],
  COMPOSITE: [99, 109, 112, 116]
};

// TILE CONSTANTS
export const TILE3D_OPTIMIZATION_HINT = {
  NOT_COMPUTED: -1,
  USE_OPTIMIZATION: 1,
  SKIP_OPTIMIZATION: 0
};
