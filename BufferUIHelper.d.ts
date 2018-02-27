import EsriMap = require("esri/map");
import FeatureLayer = require("esri/layers/FeatureLayer");
import BufferUI from "./BufferUI";

/**
 * Adds a "buffer" link to an InfoWindow.
 * When clicked it will add the selected feature
 * to the BufferUI geometries list.
 * @param {esri/widget/InfoWindow} infoWindow
 * @param {BufferUI} bufferUI
 */
declare function addBufferLink(): HTMLAnchorElement;

/**
 * Creates a feature layer and adds it to the map.
 * @returns {BufferFeatureLayer}
 */
declare function attachBufferUIToMap(
  map: EsriMap,
  buffer: BufferUI,
  layerId: string
): FeatureLayer;
