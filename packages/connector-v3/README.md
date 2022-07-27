@wsdot/arcgis-buffer-ui-connector-v3
====================================

This package is for use with [@wsdot/arcgis-buffer-ui] and is used for connecting the UI to an [ArcGIS API for JavaScript] (version 3.X) map.

[@wsdot/arcgis-buffer-ui]:https://www.npmjs.com/package/@wsdot/arcgis-buffer-ui
[ArcGIS API for JavaScript]:https://developers.arcgis.com/javascript/3/

Installation
------------

```console
npm add @wsdot/arcgis-buffer-ui @wsdot/arcgis-buffer-ui-connector-v3
```

Example
-------

```typescript
import { BufferUI } from "@wsdot/arcgis-buffer-ui";
import { attachBufferUIToMap } from "@wsdot/arcgis-buffer-ui-connector-v3";
import arcgisUtils from "esri/arcgis/utils";
import esriConfig from "esri/config";

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
```