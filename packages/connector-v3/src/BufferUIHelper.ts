/**
 * This module is used to make the BufferUI interact with an ArcGIS API for JavaScript v3 map.
 */

import Popup from "esri/dijit/Popup";
import PopupTemplate from "esri/dijit/PopupTemplate";
import Geometry from "esri/geometry/Geometry";
import geometryEngineAsync from "esri/geometry/geometryEngineAsync";
import geometryJsonUtils from "esri/geometry/jsonUtils";
import Polygon from "esri/geometry/Polygon";
import Graphic from "esri/graphic";
import FeatureLayer from "esri/layers/FeatureLayer";
import EsriMap from "esri/map";
import { BufferUI, getUnitForId } from "@wsdot/arcgis-buffer-ui";

/**
 * Adds a "buffer" link to an InfoWindow's ".actionList" section.
 * When clicked it will add the selected feature
 * to the BufferUI geometries list.
 * @param infoWindow - A Popup
 * @param bufferUI - A BufferUI object.
 */
export function addBufferLink(infoWindow: Popup, bufferUI: BufferUI) {
  const actionList = (infoWindow.domNode as Element).querySelector(".actionList");
  if (!actionList) {
    throw new Error("Info window does not have an element of class actionList.");
  }
  const link = document.createElement("a");
  const docFrag = document.createDocumentFragment();
  link.textContent = "Buffer";
  link.href = "#";
  link.title = "Add selected geometry to Buffer UI list";
  link.classList.add("action");
  link.classList.add("buffer");
  // Add a space before adding link.
  docFrag.appendChild(document.createTextNode(" "));
  docFrag.appendChild(link);

  link.onclick = () => {
    const feature = infoWindow.features[infoWindow.selectedIndex];
    bufferUI.addFeature(feature);

    return false;
  };

  actionList.appendChild(docFrag);
  return link;
}

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

  const popupTemplate = new PopupTemplate({
    title: "Buffer",
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

  const bufferFeatureLayer = new FeatureLayer(
    {
      featureSet: null,
      layerDefinition: {
        geometryType: "esriGeometryPolygon",
        fields: [
          {
            name: "oid",
            type: "esriFieldTypeOID"
          },
          {
            name: "distance",
            type: "esriFieldTypeDouble"
          },
          {
            name: "unit",
            type: "esriFieldTypeString",
            alias: "Measurement Unit"
          },
          {
            name: "unioned",
            type: "esriFieldTypeSmallInteger",
            alias: "Is Unioned"
          },
          {
            name: "area",
            type: "esriFieldTypeDouble",
            alias: "Area"
          },
          {
            name: "areaUnit",
            type: "esriFieldTypeString",
            alias: "Area Unit"
          }
        ]
      }
    },
    {
      id: layerId,
      className: "buffer"
    }
  );

  bufferFeatureLayer.setInfoTemplate(popupTemplate);

  map.addLayer(bufferFeatureLayer);

  addBufferLink(map.infoWindow as Popup, buffer);

  buffer.form.addEventListener("clear-graphics", () => {
    bufferFeatureLayer.clear();
  });

  buffer.form.addEventListener("buffer", (e: any) => {
    const { detail } = e;

    // Convert regular objects into esri/Geometry objects.
    if (Array.isArray(detail.geometry)) {
      detail.geometry = detail.geometry.map(
        geometryJsonUtils.fromJson,
        detail.geometry
      );
    } else {
      detail.geometry = geometryJsonUtils.fromJson(detail.geometry);
    }

    // The geometry engine requires that the number of geometries and distances be the same.
    // If multiple distances are provided but only a single geometry, that geometry will be
    // buffered for each distance.
    if (Array.isArray(detail.distance) && !Array.isArray(detail.geometry)) {
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
        detail.geometry,
        detail.distance,
        detail.unit,
        detail.unionResults
      )
      .then(
        (bufferResults: Polygon | Polygon[]) => {
          console.log("buffer results", bufferResults);
          const unit = getUnitForId(detail.unit);
          // unit = unit.description;
          const promises = new Array<Promise<any>>();
          if (bufferResults) {
            bufferFeatureLayer.suspend();
            if (!Array.isArray(bufferResults)) {
              bufferResults = [bufferResults];
            }
            bufferResults.forEach((geometry: Geometry, i: number) => {
              const promise = geometryEngineAsync
                .planarArea(geometry, undefined as any)
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
                      areaUnit: acres < 1 ? "ft\u00b2" : "ac" // ft. squared or acres
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
                      areaError: error
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
