// loaders.gl, MIT license

/* eslint-disable camelcase */

import type {
  WMSCapabilities,
  _WMSFeatureInfo as WMSFeatureInfo,
  _WMSLayerDescription as WMSLayerDescription
} from '@loaders.gl/wms';
import {
  WMSCapabilitiesLoader,
  _WMSFeatureInfoLoader as WMSFeatureInfoLoader,
  _WMSLayerDescriptionLoader as WMSLayerDescriptionLoader,
  WMSErrorLoader
} from '@loaders.gl/wms';
import {ImageLoader, ImageType} from '@loaders.gl/images';
import {LoaderOptions} from '@loaders.gl/loader-utils';

import {ImageSource, ImageSourceMetadata, ImageSourceGetImageParameters} from './image-source';

type FetchLike = (url: string, options?: RequestInit) => Promise<Response>;

type WMSCommonParameters = {
  /** In case the endpoint supports multiple services */
  service?: 'WMS';
  /** In case the endpoint supports multiple WMS versions */
  version?: '1.1.1' | '1.3.0';
};

export type WMSGetCapabilitiesParameters = WMSCommonParameters & {
  /** Request type */
  request?: 'GetCapabilities';
};

export type WMSGetMapParameters = WMSCommonParameters & {
  /** Request type */
  request?: 'GetMap';
  /** Layers to render */
  layers: string | string[];
  /** Styling */
  styles?: unknown;
  /** bounding box of the requested map image */
  bbox: [number, number, number, number];
  /** pixel width of returned image */
  width: number;
  /** pixels */
  height: number;
  /** srs for the image (not the bounding box) */
  srs?: string;
  /** requested format for the return image */
  format?: 'image/png';
};

// https://imagery.pasda.psu.edu/arcgis/services/pasda/UrbanTreeCanopy_Landcover/MapServer/WmsServer?SERVICE=WMS&
export type WMSGetFeatureInfoParameters = WMSCommonParameters & {
  /** Request type */
  request?: 'GetFeatureInfo';

  /** x coordinate for the feature info request */
  x: number;
  /** y coordinate for the feature info request */
  y: number;
  /** list of layers to query (could be different from rendered layers) */
  query_layers: string[];
  /** MIME type of returned feature info */
  info_format?: 'text/plain';

  /** Layers to render */
  layers: string[];
  /** Styling */
  styles?: unknown;
  /** bounding box of the requested map image */
  bbox: [number, number, number, number];
  /** pixel width of returned image */
  width: number;
  /** pixels */
  height: number;
  /** srs for the image (not the bounding box) */
  srs?: string;
  /** requested format for the return image */
  format?: 'image/png';
};

export type WMSDescribeLayerParameters = WMSCommonParameters & {
  /** Request type */
  request?: 'DescribeLayer';
};

export type WMSGetLegendGraphicParameters = WMSCommonParameters & {
  /** Request type */
  request?: 'GetLegendGraphic';
};

/** Properties that can be specified when creating a new WMS service */
export type WMSServiceProps = {
  /** Base URL to the service */
  url: string;
  /** Any load options to the loaders.gl Loaders used by the WMSService methods */
  loadOptions?: LoaderOptions;
  /** Override the fetch function if required */
  fetch?: typeof fetch | FetchLike;
};

/**
 * The WMSService class provides
 * - provides type safe methods to form URLs to a WMS service
 * - provides type safe methods to query and parse results (and errors) from a WMS service
 * - implements the ImageService interface
 * @note Only the URL parameter conversion is supported. XML posts are not supported.
 */
export class WMSService extends ImageSource {
  url: string;
  loadOptions: LoaderOptions = {
    // We want error responses to throw exceptions, the WMSErrorLoader can do this
    wms: {throwOnError: true}
  };
  fetch: typeof fetch | FetchLike;

  /** A list of loaders used by the WMSService methods */
  readonly loaders = [
    ImageLoader,
    WMSErrorLoader,
    WMSCapabilitiesLoader,
    WMSFeatureInfoLoader,
    WMSLayerDescriptionLoader
  ];

  /** Create a WMSService */
  constructor(props: WMSServiceProps) {
    super();
    this.url = props.url;
    // TODO Need an options merge function from loaders.gl to merge subobjects
    Object.assign(this.loadOptions, props.loadOptions);
    this.fetch = props.fetch || fetch;
  }

  // ImageSource implementation
  getMetadata(): Promise<ImageSourceMetadata> {
    return this.getCapabilities();
  }

  getImage(parameters: ImageSourceGetImageParameters): Promise<ImageType> {
    return this.getImage(parameters);
  }

  // WMS Service API Stubs

  /** Get Capabilities */
  async getCapabilities(
    wmsParameters?: WMSGetCapabilitiesParameters,
    vendorParameters?: Record<string, unknown>
  ): Promise<WMSCapabilities> {
    const url = this.getCapabilitiesURL(wmsParameters, vendorParameters);
    const {fetch} = this;
    const response = await fetch(url, this.loadOptions);
    const arrayBuffer = await response.arrayBuffer();
    this._checkResponse(response, arrayBuffer);
    return await WMSCapabilitiesLoader.parse(arrayBuffer, this.loadOptions);
  }

  /** Get a map image */
  async getMap(
    options: WMSGetMapParameters,
    vendorParameters?: Record<string, unknown>
  ): Promise<ImageType> {
    const url = this.getMapURL(options, vendorParameters);
    const {fetch} = this;
    const response = await fetch(url, this.loadOptions);
    const arrayBuffer = await response.arrayBuffer();
    this._checkResponse(response, arrayBuffer);
    try {
      return await ImageLoader.parse(arrayBuffer, this.loadOptions);
    } catch {
      throw this._parseError(arrayBuffer);
    }
  }

  /** Get Feature Info for a coordinate */
  async getFeatureInfo(
    options: WMSGetFeatureInfoParameters,
    vendorParameters?: Record<string, unknown>
  ): Promise<WMSFeatureInfo> {
    const url = this.getFeatureInfoURL(options, vendorParameters);
    const response = await this.fetch(url, this.loadOptions);
    const arrayBuffer = await response.arrayBuffer();
    this._checkResponse(response, arrayBuffer);
    return await WMSFeatureInfoLoader.parse(arrayBuffer, this.loadOptions);
  }

  /** Get more information about a layer */
  async describeLayer(
    options: WMSDescribeLayerParameters,
    vendorParameters?: Record<string, unknown>
  ): Promise<WMSLayerDescription> {
    const url = this.describeLayerURL(options, vendorParameters);
    const response = await this.fetch(url, this.loadOptions);
    const arrayBuffer = await response.arrayBuffer();
    this._checkResponse(response, arrayBuffer);
    return await WMSLayerDescriptionLoader.parse(arrayBuffer, this.loadOptions);
  }

  /** Get an image with a semantic legend */
  async getLegendGraphic(
    options: WMSGetLegendGraphicParameters,
    vendorParameters?: Record<string, unknown>
  ): Promise<ImageType> {
    const url = this.getLegendGraphicURL(options, vendorParameters);
    const response = await this.fetch(url, this.loadOptions);
    const arrayBuffer = await response.arrayBuffer();
    this._checkResponse(response, arrayBuffer);
    try {
      return await ImageLoader.parse(arrayBuffer, this.loadOptions);
    } catch {
      throw this._parseError(arrayBuffer);
    }
  }

  // Typed URL creators
  // For applications that want full control of fetching and parsing

  /** Generate a URL for the GetCapabilities request */
  getCapabilitiesURL(
    wmsParameters?: WMSGetCapabilitiesParameters,
    vendorParameters?: Record<string, unknown>
  ): string {
    const options: Required<WMSGetCapabilitiesParameters> = {
      service: 'WMS',
      version: '1.1.1',
      request: 'GetCapabilities',
      ...wmsParameters,
      ...vendorParameters
    };
    return this._getWMSUrl(options, vendorParameters);
  }

  /** Generate a URL for the GetMap request */
  getMapURL(
    wmsParameters: WMSGetMapParameters,
    vendorParameters?: Record<string, unknown>
  ): string {
    const options: Required<WMSGetMapParameters> = {
      service: 'WMS',
      version: '1.1.1',
      request: 'GetMap',
      // layers: [],
      // bbox: [-77.87304, 40.78975, -77.85828, 40.80228],
      // width: 1200,
      // height: 900,
      styles: undefined,
      srs: 'EPSG:4326',
      format: 'image/png',
      ...wmsParameters,
      ...vendorParameters
    };
    return this._getWMSUrl(options, vendorParameters);
  }

  /** Generate a URL for the GetFeatureInfo request */
  getFeatureInfoURL(
    wmsParameters: WMSGetFeatureInfoParameters,
    vendorParameters?: Record<string, unknown>
  ): string {
    const options: Required<WMSGetFeatureInfoParameters> = {
      service: 'WMS',
      version: '1.1.1',
      request: 'GetFeatureInfo',
      // layers: [],
      // bbox: [-77.87304, 40.78975, -77.85828, 40.80228],
      // width: 1200,
      // height: 900,
      // x: undefined!,
      // y: undefined!,
      // query_layers: [],
      srs: 'EPSG:4326',
      format: 'image/png',
      info_format: 'text/plain',
      styles: undefined,
      ...wmsParameters,
      ...vendorParameters
    };
    return this._getWMSUrl(options, vendorParameters);
  }

  /** Generate a URL for the GetFeatureInfo request */
  describeLayerURL(
    wmsParameters: WMSDescribeLayerParameters,
    vendorParameters?: Record<string, unknown>
  ): string {
    const options: Required<WMSDescribeLayerParameters> = {
      service: 'WMS',
      version: '1.1.1',
      request: 'DescribeLayer',
      ...wmsParameters,
      ...vendorParameters
    };
    return this._getWMSUrl(options, vendorParameters);
  }

  getLegendGraphicURL(
    wmsParameters: WMSGetLegendGraphicParameters,
    vendorParameters?: Record<string, unknown>
  ): string {
    const options: Required<WMSGetLegendGraphicParameters> = {
      service: 'WMS',
      version: '1.1.1',
      request: 'GetLegendGraphic',
      ...wmsParameters,
      ...vendorParameters
    };
    return this._getWMSUrl(options, vendorParameters);
  }

  // INTERNAL METHODS

  /**
   * @note case _getWMSUrl may need to be overridden to handle certain backends?
   * */
  protected _getWMSUrl(
    options: Record<string, unknown>,
    vendorParameters?: Record<string, unknown>
  ): string {
    let url = `${this.url}`;
    let first = true;
    for (const [key, value] of Object.entries(options)) {
      url += first ? '?' : '&';
      first = false;
      if (Array.isArray(value)) {
        url += `${key.toUpperCase()}=${value.join(',')}`;
      } else {
        url += `${key.toUpperCase()}=${value ? String(value) : ''}`;
      }
    }
    return encodeURI(url);
  }

  /** Checks for and parses a WMS XML formatted ServiceError and throws an exception */
  protected _checkResponse(response: Response, arrayBuffer: ArrayBuffer): void {
    const contentType = response.headers['content-type'];
    if (!response.ok || WMSErrorLoader.mimeTypes.includes(contentType)) {
      const error = WMSErrorLoader.parseSync(arrayBuffer, this.loadOptions);
      throw new Error(error);
    }
  }

  /** Error situation detected */
  protected _parseError(arrayBuffer: ArrayBuffer): Error {
    const error = WMSErrorLoader.parseSync(arrayBuffer, this.loadOptions);
    return new Error(error);
  }
}