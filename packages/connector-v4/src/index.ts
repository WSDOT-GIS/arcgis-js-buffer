/**
 * This module is used to make the BufferUI interact with an ArcGIS API for JavaScript v3 map.
 */

import { BufferUI, getUnitForId } from "@wsdot/arcgis-buffer-ui";
import Popup = require("esri/widgets/Popup");
import PopupTemplate = require("esri/PopupTemplate");
import Geometry = require("esri/geometry/Geometry");
import geometryEngineAsync = require("esri/geometry/geometryEngineAsync");
import geometryJsonUtils = require("esri/geometry/support/jsonUtils");
import Polygon = require("esri/geometry/Polygon");
import Graphic = require("esri/Graphic");
import GraphicsLayer = require("esri/layers/GraphicsLayer");
import View = require("esri/views/View");
import SimpleFillSymbol = require("esri/symbols/SimpleFillSymbol");

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
): GraphicsLayer {
  let oid = 0;

  const bufferActionId = "buffer";

  const popupTemplate = new PopupTemplate({
    title: "Buffer",
    content: (graphic: Graphic) => {
      const { attributes } = graphic;
      const table = document.createElement("table");
      for (const name in attributes) {
        if (attributes.hasOwnProperty(name)) {
          const value = attributes[name];
          const row = table.insertRow(-1);
          let cell = row.insertCell(-1);
          cell.textContent = name;
          cell = row.insertCell(-1);
          cell.textContent = `${value}`;
        }
      }
      return table;
    }
  });

  // const bufferFeatureLayer = new FeatureLayer({
  //   source: [],
  //   geometryType: "esriGeometryPolygon",
  //   objectIdField: "oid",
  //   fields: [
  //     {
  //       name: "oid",
  //       type: "esriFieldTypeOID"
  //     },
  //     {
  //       name: "distance",
  //       type: "esriFieldTypeDouble"
  //     },
  //     {
  //       name: "unit",
  //       type: "esriFieldTypeString",
  //       alias: "Measurement Unit"
  //     },
  //     {
  //       name: "unioned",
  //       type: "esriFieldTypeSmallInteger",
  //       alias: "Is Unioned"
  //     },
  //     {
  //       name: "area",
  //       type: "esriFieldTypeDouble",
  //       alias: "Area"
  //     },
  //     {
  //       name: "areaUnit",
  //       type: "esriFieldTypeString",
  //       alias: "Area Unit"
  //     }
  //   ]
  // });

  var symbol = {
    type: "simple-fill", // autocasts as new SimpleFillSymbol()
    color: [51, 51, 204, 0.9],
    style: "solid",
    outline: {
      // autocasts as new SimpleLineSymbol()
      color: "white",
      width: 1
    }
  };

  const bufferFeatureLayer = new GraphicsLayer();

  // bufferFeatureLayer.popupTemplate = popupTemplate;

  const templateAction = {
    title: "Buffer current geometry",
    id: bufferActionId,
    className: "action-buffer"
  } as any;

  view.popup.actions.add(templateAction);

  view.map.add(bufferFeatureLayer, 0);
  view.popup.on("trigger-action", event => {
    const { action, target } = event;
    const { id } = action;
    if (id === bufferActionId) {
      buffer.addFeature(view.popup.selectedFeature);
    }
  });

  buffer.form.addEventListener("clear-graphics", async () => {
    bufferFeatureLayer.removeAll();
  });

  interface IHasObjectId {
    objectId: number;
    [key: string]: any;
  }

  interface IEditResults {
    addFeatures: Graphic[];
    updateFeatures: Graphic[];
    deleteFeatures: Graphic[] | IHasObjectId[];
  }

  buffer.form.addEventListener("buffer", async (e: any) => {
    const { detail } = e;

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

    let bufferResults: Polygon | Polygon[] | undefined;

    try {
      bufferResults = await geometryEngineAsync.buffer(
        detail.geometry,
        detail.distance,
        detail.unit,
        detail.unionResults
      );
    } catch (bufferError) {
      console.error("buffer failed", bufferError);
    } finally {
      console.log("buffer results", bufferResults);
    }

    const unit = getUnitForId(detail.unit);
    // unit = unit.description;
    if (bufferResults) {
      if (!Array.isArray(bufferResults)) {
        bufferResults = [bufferResults];
      }
      bufferResults.forEach(async (geometry: Geometry, i: number) => {
        let area: number | undefined;
        let areaError: Error | undefined;
        const attributes: any = {
          oid: oid++,
          distance: Array.isArray(detail.distance)
            ? detail.distance[i]
            : detail.distance,
          unit: unit.description,
          unioned: detail.unionResults
        };
        try {
          area = await geometryEngineAsync.planarArea(
            geometry as Polygon,
            undefined as any
          );
        } catch (ex) {
          areaError = ex;
          console.error("area error", ex);
        }

        console.log("area", area);
        if (area) {
          const acres = area / 4047;
          const subAcre = acres < 1;
          attributes.area = subAcre ? acres * 43560 : acres;
          attributes.areaUnit = subAcre ? "ft\u00b2" : "ac"; // ft. squared or acres
        } else {
          attributes.areaError = areaError;
        }

        const graphic = new Graphic({
          geometry,
          attributes,
          symbol,
          popupTemplate
        });

        console.log("buffer grahpic", graphic);

        bufferFeatureLayer.add(graphic);
      });
    }
    buffer.clearGeometryList();
  });

  return bufferFeatureLayer;
}
