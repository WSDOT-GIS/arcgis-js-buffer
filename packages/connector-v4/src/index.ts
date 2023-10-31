/**
 * This module is used to make the BufferUI interact with an ArcGIS API for JavaScript v3 map.
 */

import { BufferUI, IBufferEventDetail, getUnitForId } from "@wsdot/arcgis-buffer-ui";
import Graphic from "esri/Graphic";
import PopupTemplate from "esri/PopupTemplate";
import Geometry from "esri/geometry/Geometry";
import Polygon from "esri/geometry/Polygon";
import geometryEngineAsync from "esri/geometry/geometryEngineAsync";
import geometryJsonUtils from "esri/geometry/support/jsonUtils";
import FeatureLayer from "esri/layers/FeatureLayer";
import View from "esri/views/View";
// import Popup from "esri/widgets/Popup";

// /**
//  * Adds a "buffer" link to an InfoWindow's ".actionList" section.
//  * When clicked it will add the selected feature
//  * to the BufferUI geometries list.
//  * @param infoWindow - A Popup
//  * @param bufferUI - A BufferUI object.
//  */
// export function addBufferLink(infoWindow: Popup, bufferUI: BufferUI) {
//   const action: any = {
//     title: "Buffer current geometry",
//     id: "buffer",
//     className: "action-buffer"
//   };
//   infoWindow.actions.push(action);
//   infoWindow.on("trigger-action", (event) => {
//     bufferUI.addFeature(infoWindow.selectedFeature);
//   })
// }

/**
 * Creates a feature layer and adds it to the map.
 * @param view
 * @param buffer
 * @param layerId - Specifies the id property's value of the layer FeatureLayer that will be used to display the buffer polygons.
 * @returns Returns the FeatureLayer that was created to display buffer polygons.
 */
export function attachBufferUIToMap(
  view: View,
  buffer: BufferUI,
  layerId: string = "Buffer"
): FeatureLayer {
  let oid = 0;

  const popupTemplate = new PopupTemplate({
    title: "Buffer",
    actions: [
      {
        type: "button",
        title: "Buffer current geometry",
        id: "buffer",
        className: "action-buffer"
      }
    ],
    fieldInfos: [
      {
        fieldName: "distance",
        label: "Buffer Distance",
        visible: true,
        format: {
          places: 0,
          digitSeparator: true
        }
      },
      {
        fieldName: "unit",
        label: "Measurement Unit",
        visible: true
      },
      {
        fieldName: "area",
        label: "Area",
        visible: true,
        format: {
          places: 0,
          digitSeparator: true
        }
      },
      {
        fieldName: "areaUnit",
        label: "Area Unit",
        visible: true
      }
    ]
  });

  const bufferFeatureLayer = new FeatureLayer({
    id: layerId,
    geometryType: "polygon",
    fields: [
      {
        name: "oid",
        type: "oid"
      },
      {
        name: "distance",
        type: "double"
      },
      {
        name: "unit",
        type: "string",
        alias: "Measurement Unit"
      },
      {
        name: "unioned",
        type: "integer",
        alias: "Is Unioned"
      },
      {
        name: "area",
        type: "double",
        alias: "Area"
      },
      {
        name: "areaUnit",
        type: "string",
        alias: "Area Unit"
      }
    ]
  });

  bufferFeatureLayer.popupTemplate = popupTemplate;

  view.map.add(bufferFeatureLayer);
  view.popup.on("trigger-action", () => {
    buffer.addFeature(view.popup.selectedFeature);
  });

  buffer.form.addEventListener("clear-graphics", async () => {
    const features = await bufferFeatureLayer.queryFeatures();
    await bufferFeatureLayer.applyEdits({
      deleteFeatures: features.features
    });
  });

  buffer.form.addEventListener("buffer", (e: Event) => {
    const { detail } = (e as CustomEvent<IBufferEventDetail>);

    // Convert regular objects into esri/Geometry objects.
    if (Array.isArray(detail.geometry)) {
      detail.geometry = detail.geometry.map(
        geometryJsonUtils.fromJSON,
        detail.geometry
      );
    } else {
      detail.geometry = geometryJsonUtils.fromJSON(detail.geometry);
    }

    // The geometry engine requires that the number of geometries and distances be the same.
    // If multiple distances are provided but only a single geometry, that geometry will be
    // buffered for each distance.
    if (Array.isArray(detail.distance) && !Array.isArray(detail.geometry)) {
      detail.geometry = (() => {
        const outGeoArray = new Array<Geometry>(detail.distance.length);
        for (let i = 0, l = detail.distance.length; i < l; i += 1) {
          outGeoArray[i] = detail.geometry as Geometry;
        }
        return outGeoArray;
      })();
    } else if (
      !Array.isArray(detail.distance) &&
      Array.isArray(detail.geometry)
    ) {
      detail.distance = (() => {
        const outDistanceArray = new Array<number>(detail.geometry.length);
        for (let i = 0; i < detail.geometry.length; i++) {
          if (detail.distance == null) {
            throw new TypeError("Distance should not be null.")
          }
          outDistanceArray[i] = detail.distance;
        }
        return outDistanceArray;
      })();
    }

    geometryEngineAsync
      .buffer(
        detail.geometry as Geometry | Geometry[],
        detail.distance as number | number[],
        detail.unit,
        detail.unionResults
      )
      .then(
        (bufferResults: Polygon | Polygon[]) => {
          console.log("buffer results", bufferResults);
          const unit = getUnitForId(detail.unit);
          // unit = unit.description;
          if (bufferResults) {
            if (!Array.isArray(bufferResults)) {
              bufferResults = [bufferResults];
            }
            bufferResults.forEach((geometry: Geometry, i: number) => {
              geometryEngineAsync
                .planarArea(geometry as Polygon)
                .then(
                  (area: number) => {
                    console.debug("area", area);
                    const acres = area / 4047;
                    const graphic = new Graphic({
                      geometry,
                      attributes: {
                        oid: oid++,
                        distance: Array.isArray(detail.distance)
                          ? detail.distance[i]
                          : detail.distance,
                        unit: unit.description,
                        unioned: detail.unionResults,
                        area: acres < 1 ? acres * 43560 : acres,
                        areaUnit: acres < 1 ? "ft\u00b2" : "ac" // ft. squared or acres
                      }
                    });
                    bufferFeatureLayer.applyEdits([graphic]);
                  },
                  (error: Error) => {
                    console.error("area", error);
                    const graphic = new Graphic({
                      geometry,
                      attributes: {
                        oid: oid++,
                        distance: Array.isArray(detail.distance)
                          ? detail.distance[i]
                          : detail.distance,
                        unit: unit.description,
                        unioned: detail.unionResults,
                        areaError: error
                      }
                    });
                    bufferFeatureLayer.applyEdits([graphic]);
                  }
                );
            });
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
