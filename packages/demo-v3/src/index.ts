import { BufferUI } from "@wsdot/arcgis-buffer-ui";
import { attachBufferUIToMap } from "@wsdot/arcgis-buffer-ui-connector-v3";
import esriConfig from "esri/config";
import PopupTemplate from "esri/dijit/PopupTemplate";
import FeatureLayer from "esri/layers/FeatureLayer";
import EsriMap from "esri/map";
import Extent from "esri/geometry/Extent";

// Specify CORS enabled servers and HTTPs supporting domains.
[
  "www.wsdot.wa.gov",
  "wsdot.wa.gov",
  "data.wsdot.wa.gov",
  "gispublic.dfw.wa.gov",
].forEach((svr) => {
  esriConfig.defaults.io.corsEnabledServers.push(svr);
  esriConfig.defaults.io.httpsDomains.push(svr);
});
// Since CORS servers are explicitly specified, CORS detection is not necessary.
// This prevents the following types of errors from appearing in the console:
// XMLHttpRequest cannot load http://gis.rita.dot.gov/ArcGIS/rest/info?f=json. No 'Access-Control-Allow-Origin' header is present on the requested resource. Origin 'http://example.com' is therefore not allowed access.
esriConfig.defaults.io.corsDetection = false;

// Create the Buffer UI in the specified node.
const bufferElement = document.getElementById("buffer")!;
const buffer = new BufferUI(bufferElement);

const milepostLayer = new FeatureLayer(
  "https://data.wsdot.wa.gov/arcgis/rest/services/Shared/InterchangeDrawings/FeatureServer/0",
  {
    infoTemplate: new PopupTemplate({
      title: "feature",
    }),
  }
);

const map = new EsriMap("map", {
  basemap: "streets-vector",
  extent: new Extent({
    xmin: -124.79,
    ymin: 45.54,
    xmax: -116.91,
    ymax: 49.05,
  }),
});

map.addLayer(milepostLayer);

// Setup the Buffer UI with the map.
attachBufferUIToMap(map, buffer);
