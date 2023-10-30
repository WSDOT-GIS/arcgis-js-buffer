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
import Polygon from "esri/geometry/Polygon";
import geometryEngineAsync from "esri/geometry/geometryEngineAsync";
import geometryJsonUtils from "esri/geometry/jsonUtils";
import Graphic from "esri/graphic";
import FeatureLayer from "esri/layers/FeatureLayer";
import EsriMap from "esri/map";
import {
  addBufferLink,
  createBufferLayer,
  createPopupTemplate,
} from "./layerSetup";

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
  layerId: string = "Buffer"
): FeatureLayer {
  let oid = 0;

  const popupTemplate = createPopupTemplate();

  const bufferFeatureLayer = createBufferLayer(layerId, popupTemplate);

  map.addLayer(bufferFeatureLayer);

  addBufferLink(map.infoWindow as Popup, buffer);

  buffer.form.addEventListener("clear-graphics", () => {
    bufferFeatureLayer.clear();
  });

  buffer.form.addEventListener("buffer", (e: Event) => {
    const { detail } = e as CustomEvent<IBufferEventDetail>;

    if (detail.geometry === null) {
      throw new TypeError(
        'Expected "buffer" event to have non-null "detail" property'
      );
    }

    // Convert regular objects into esri/Geometry objects.
    if (Array.isArray(detail.geometry)) {
      detail.geometry = detail.geometry.map(
        geometryJsonUtils.fromJson,
        detail.geometry
      );
    } else {
      detail.geometry = geometryJsonUtils.fromJson(detail.geometry);
    }

    if (detail.distance === null) {
      throw new TypeError("Expected detail.distance to be non-null.");
    }

    // The geometry engine requires that the number of geometries and distances be the same.
    // If multiple distances are provided but only a single geometry, that geometry will be
    // buffered for each distance.
    if (Array.isArray(detail.distance) && !Array.isArray(detail.geometry)) {
      if (!(detail.geometry instanceof Geometry)) {
        throw new TypeError(
          "detail.geometry should be an ArcGIS API Geometry object by this point"
        );
      }
      detail.geometry = (() => {
        const outGeoArray = new Array<Geometry>(detail.distance.length);
        for (let i = 0, l = detail.distance.length; i < l; i += 1) {
          outGeoArray[i] = detail.geometry;
        }
        return outGeoArray;
      })();
    } else if (
      !Array.isArray(detail.distance) &&
      Array.isArray(detail.geometry)
    ) {
      detail.distance = (() => {
        const outDistanceArray = new Array<number>();
        for (let i = 0; i < detail.geometry.length; i++) {
          outDistanceArray[i] = detail.distance;
        }
        return outDistanceArray;
      })();
    }

    geometryEngineAsync
      .buffer(
        detail.geometry as Geometry[] | Geometry,
        detail.distance,
        detail.unit,
        detail.unionResults
      )
      .then(
        (bufferResults: Polygon | Polygon[]) => {
          console.log("buffer results", bufferResults);
          const unit = getUnitForId(detail.unit);
          // unit = unit.description;
          const promises = new Array<Promise<number>>();
          if (bufferResults) {
            bufferFeatureLayer.suspend();
            if (!Array.isArray(bufferResults)) {
              bufferResults = [bufferResults];
            }
            bufferResults.forEach((geometry: Geometry, i: number) => {
              const promise = geometryEngineAsync
                .planarArea(geometry, 
                  // typing incorrectly disallows the unit parameter to be undefined.
                  // cast to unknown -> number | string to avoid TypeScript error.
                  undefined as unknown as number | string
                  )
                .then(
                  (area: number) => {
                    console.debug("area", area);
                    const acres = area / 4047;
                    const graphic = new Graphic(geometry, undefined, {
                      oid: oid++,
                      distance: Array.isArray(detail.distance)
                        ? detail.distance[i]
                        : detail.distance,
                      unit: unit.description,
                      unioned: detail.unionResults,
                      area: acres < 1 ? acres * 43560 : acres,
                      areaUnit: acres < 1 ? "ft\u00b2" : "ac", // ft. squared or acres
                    });
                    bufferFeatureLayer.applyEdits([graphic]);
                  },
                  (error: Error) => {
                    console.error("area", error);
                    const graphic = new Graphic(geometry, undefined, {
                      oid: oid++,
                      distance: Array.isArray(detail.distance)
                        ? detail.distance[i]
                        : detail.distance,
                      unit: unit.description,
                      unioned: detail.unionResults,
                      areaError: error,
                    });
                    bufferFeatureLayer.applyEdits([graphic]);
                  }
                );
              promises.push(promise);
            });
            Promise.all(promises).then(
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
  });

  return bufferFeatureLayer;
}
