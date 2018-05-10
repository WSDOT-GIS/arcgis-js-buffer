import { BufferUI } from "@wsdot/arcgis-buffer-ui";
import { attachBufferUIToMap } from "@wsdot/arcgis-buffer-ui-connector-v4";
import Layer = require("esri/layers/Layer");
import EsriMap = require("esri/Map");
import MapView = require("esri/views/MapView");

// WA extent https://epsg.io/1416-area
const [xmin, ymin, xmax, ymax] = [-124.79, 45.54, -116.91, 49.05];

const airportsId = "ddb7c46710a44a5884a3f95dc8672fef";
const cityId = "0b12f000a66f4d75a43ea3ac4ead01dc";

// Create the Buffer UI in the specified node.
const bufferElement = document.getElementById("buffer")!;
const buffer = new BufferUI(bufferElement);

const map = new EsriMap({
  basemap: "gray-vector"
});

const mapView = new MapView({
  map,
  container: "map",
  extent: {
    xmin,
    ymin,
    xmax,
    ymax,
    spatialReference: { wkid: 4326 }
  },
  spatialReference: {
    wkid: 102100
  }
});

const layerPromises = [airportsId, cityId].map(async id => {
  const layer = await Layer.fromPortalItem({
    portalItem: {
      id
    }
  } as any);

  map.layers.add(layer);

  return layer;
});

// Setup the Buffer UI with the map.
attachBufferUIToMap(mapView, buffer);
