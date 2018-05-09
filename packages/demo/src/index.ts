import { BufferUI } from "@wsdot/arcgis-buffer-ui";
import { attachBufferUIToMap } from "@wsdot/arcgis-v3-buffer-ui-helper";
import arcgisUtils = require("esri/arcgis/utils");
import esriConfig = require("esri/config");

// Specify CORS enabled servers and HTTPs supporting domains.
[
  "www.wsdot.wa.gov",
  "wsdot.wa.gov",
  "data.wsdot.wa.gov",
  "gispublic.dfw.wa.gov"
].forEach(svr => {
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

// Create a map from a predefined webmap on AGOL.
arcgisUtils
  .createMap("927b5daaa7f4434db4b312364489544d", "map")
  .then((response: any) => {
    const map = response.map;

    // Setup the Buffer UI with the map.
    attachBufferUIToMap(map, buffer);

    // Turn on some layers that are off by default.
    const airportRe = /^((Airport)|(CityLimits))/i;
    for (const layerId of map.layerIds) {
      if (airportRe.test(layerId)) {
        const layer = map.getLayer(layerId);
        layer.show();
      }
    }
  });
