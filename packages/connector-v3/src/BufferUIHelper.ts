/**
 * This module is used to make the BufferUI interact with an ArcGIS API for JavaScript v3 map.
 */

import {
  BufferUI,
  getUnitForId,
  type IBufferEventDetail,
} from "@wsdot/arcgis-buffer-ui";
import Popup from "esri/dijit/Popup";
import Geometry from "esri/geometry/Geometry";
import * as projection from "esri/geometry/projection";
import Polygon from "esri/geometry/Polygon";
import geometryEngineAsync from "esri/geometry/geometryEngineAsync";
import geometryJsonUtils from "esri/geometry/jsonUtils";
import Graphic from "esri/graphic";
import FeatureLayer from "esri/layers/FeatureLayer";
import EsriMap from "esri/map";
import SpatialReference from "esri/SpatialReference";
import {
  addBufferLink,
  createBufferLayer,
  createPopupTemplate,
} from "./layerSetup";

projection.load().then(() => console.debug("projection engine loaded"));

/**
 * Object ID for features. Will be incremented as features are added.
 */
let oid = 0;

/**
 * Creates a feature layer and adds it to the map.
 * @param map
 * @param buffer
 * @param layerId - Specifies the id property's value of the layer FeatureLayer that will be used to display the buffer polygons.
 * @returns Returns the FeatureLayer that was created to display buffer polygons.
 */
export function attachBufferUIToMap(
  map: EsriMap,
  buffer: BufferUI,
  layerId: string = "Buffer",
  spatialReference: SpatialReference = new SpatialReference({ wkid: 2927 })
): FeatureLayer {
  const popupTemplate = createPopupTemplate();

  const bufferFeatureLayer = createBufferLayer(layerId, popupTemplate);

  map.addLayer(bufferFeatureLayer);

  addBufferLink(map.infoWindow as Popup, buffer);

  buffer.form.addEventListener("clear-graphics", () => {
    bufferFeatureLayer.clear();
  });

  const bufferEventListener = (e: Event) => {
    const { detail } = e as CustomEvent<IBufferEventDetail>;

    if (detail.geometry === null) {
      throw new TypeError(
        'Expected "buffer" event to have non-null "detail" property'
      );
    }

    let geometry: Geometry | Geometry[];
    let distance: number[] | number;

    // Convert regular objects into esri/Geometry objects.
    if (Array.isArray(detail.geometry)) {
      geometry = detail.geometry.map(
        geometryJsonUtils.fromJson,
        detail.geometry
      );
    } else {
      geometry = geometryJsonUtils.fromJson(detail.geometry);
    }

    if (detail.distance === null) {
      throw new TypeError("Expected detail.distance to be non-null.");
    }

    geometry = projection.project(geometry, spatialReference);
    distance = detail.distance;

    // The geometry engine requires that the number of geometries and distances be the same.
    // If multiple distances are provided but only a single geometry, that geometry will be
    // buffered for each distance.
    [geometry, distance] = ensureArraysAreSameLength(geometry, distance);

    geometryEngineAsync
      .buffer(geometry, distance, detail.unit, detail.unionResults)
      .then(
        (bufferResults: Polygon | Polygon[]) => {
          console.log("buffer results", bufferResults);
          const unit = getUnitForId(detail.unit);
          // unit = unit.description;
          if (bufferResults) {
            bufferFeatureLayer.suspend();
            if (!Array.isArray(bufferResults)) {
              bufferResults = [bufferResults];
            }
            const areaPromises = bufferResults.map(
              async (currentGeometry: Geometry, i: number) => {
                const mapGeometry = projection.project(
                  currentGeometry,
                  map.spatialReference
                );
                try {
                  const area = await geometryEngineAsync.planarArea(
                    currentGeometry,
                    // typing incorrectly disallows the unit parameter to be undefined.
                    // cast to unknown -> number | string to avoid TypeScript error.
                    undefined as unknown as number | string
                  );

                  console.debug("area", area);
                  const acres = area / 4047;
                  const graphic = new Graphic(
                    mapGeometry as Geometry,
                    undefined,
                    {
                      oid: oid++,
                      distance: Array.isArray(distance)
                        ? distance[i]
                        : distance,
                      unit: unit.description,
                      unioned: detail.unionResults,
                      area: acres < 1 ? acres * 43560 : acres,
                      areaUnit: acres < 1 ? "ft\u00b2" : "ac", // ft. squared or acres
                    }
                  );
                  bufferFeatureLayer.applyEdits([graphic]);
                } catch (error) {
                  console.error("area", error);
                  const graphic = new Graphic(
                    mapGeometry as Geometry,
                    undefined,
                    {
                      oid: oid++,
                      distance: Array.isArray(distance)
                        ? distance[i]
                        : distance,
                      unit: unit.description,
                      unioned: detail.unionResults,
                      areaError: error,
                    }
                  );
                  bufferFeatureLayer.applyEdits([graphic]);
                }
              }
            );

            Promise.all(areaPromises).then(
              () => {
                bufferFeatureLayer.resume();
              },
              () => {
                bufferFeatureLayer.resume();
              }
            );
          }
          buffer.clearGeometryList();
        },
        (error: Error) => {
          console.error("buffer error", error);
        }
      );
  };

  buffer.form.addEventListener("buffer", bufferEventListener);

  return bufferFeatureLayer;
}

/**
 * The geometry engine requires that the number of geometries and distances be the same.
 * If multiple distances are provided but only a single geometry, that geometry will be
 * buffered for each distance.
 * @param geometry - Geometry
 * @param distance - distance
 * @returns - a tuple of geometry and distance. Both will either be a single
 * value or both arrays of the same length.
 */
function ensureArraysAreSameLength(
  geometry: Geometry | Geometry[],
  distance: number | number[]
) {
  if (Array.isArray(distance) && !Array.isArray(geometry)) {
    const outGeoArray = new Array<Geometry>(distance.length);
    for (let i = 0, l = distance.length; i < l; i += 1) {
      outGeoArray[i] = geometry;
    }
    return [outGeoArray, distance] as [Geometry[], number[]];
  } else if (!Array.isArray(distance) && Array.isArray(geometry)) {
    const outDistanceArray = new Array<number>(geometry.length);
    for (let i = 0; i < geometry.length; i++) {
      outDistanceArray[i] = distance;
    }
    return [geometry, outDistanceArray] as [Geometry[], number[]];
  }
  return [geometry, distance] as [Geometry, number];
}
