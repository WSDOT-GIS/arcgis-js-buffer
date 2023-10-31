import { BufferUI } from "@wsdot/arcgis-buffer-ui";
import Popup from "esri/dijit/Popup";
import PopupTemplate from "esri/dijit/PopupTemplate";
import FeatureLayer from "esri/layers/FeatureLayer";

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
export function createBufferLayer(layerId: string, popupTemplate: PopupTemplate) {
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
  return bufferFeatureLayer;
}
export function createPopupTemplate() {
  return new PopupTemplate({
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
}
