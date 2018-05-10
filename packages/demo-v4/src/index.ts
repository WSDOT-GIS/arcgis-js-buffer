import { BufferUI } from "@wsdot/arcgis-buffer-ui";
import { attachBufferUIToMap } from "@wsdot/arcgis-buffer-ui-connector-v4";
// import esriConfig = require("esri/config");
import MapView = require("esri/views/MapView");
import WebMap = require("esri/WebMap");

// Create the Buffer UI in the specified node.
const bufferElement = document.getElementById("buffer")!;
const buffer = new BufferUI(bufferElement);

const map = new WebMap({
  portalItem: {
    id: "927b5daaa7f4434db4b312364489544d"
  }
});

const mapView = new MapView({
  map,
  container: "map"
});

// Create a map from a predefined webmap on AGOL.
map.when(() => {
  // Setup the Buffer UI with the map.
  attachBufferUIToMap(mapView, buffer);

  // Turn on some layers that are off by default.
  const airportRe = /^((Airport)|(CityLimits))/i;
  map.layers
    .filter(l => airportRe.test(l.id) && !l.visible)
    .set("visible", true);
});
