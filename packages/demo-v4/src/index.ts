import { BufferUI } from "@wsdot/arcgis-buffer-ui";
import { attachBufferUIToMap } from "@wsdot/arcgis-buffer-ui-connector-v4";
// import esriConfig from "esri/config";
import MapView from "esri/views/MapView";
import WebMap from "esri/WebMap";
import LayerList from "esri/widgets/LayerList";

// Create the Buffer UI in the specified node.
const bufferElement = document.getElementById("buffer")!;
const buffer = new BufferUI(bufferElement);

const map = new WebMap({
  portalItem: {
    id: "d2666674071e4263ac344046f09b7599"

  }
});

const mapView = new MapView({
  map,
  container: "map"
});

const layerList = new LayerList({
  view: mapView
});

mapView.ui.add(layerList);


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
