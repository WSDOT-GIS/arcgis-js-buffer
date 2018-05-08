Buffer UI for ArcGIS API for JavaScript
=======================================

Provides a UI for a buffer operation.

See it in action here: [Demo](http://wsdot-gis.github.io/arcgis-js-buffer/)

[![npm](https://img.shields.io/npm/v/@wsdot/arcgis-buffer-ui.svg?style=flat-square)](https://www.npmjs.org/package/@wsdot/arcgis-buffer-ui)
[![npm](https://img.shields.io/npm/dm/@wsdot/arcgis-buffer-ui.svg?style=flat-square)](https://www.npmjs.org/package/@wsdot/arcgis-buffer-ui)

[![lerna](https://img.shields.io/badge/maintained%20with-lerna-cc00ff.svg)](https://lernajs.io/)

[![GitHub](https://img.shields.io/github/issues/WSDOT-GIS/arcgis-js-buffer.svg?style=flat-square)](https://github.com/WSDOT-GIS/arcgis-js-buffer/issues)

Install
-------

```console
npm install --save @wsdot/arcgis-buffer-ui
```

Usage
-----

The sample files below show how to use the package with TypeScript and Webpack.

`src\index.ts`

```TypeScript
import { attachBufferUIToMap, BufferUI } from "@wsdot/arcgis-buffer-ui";
import arcgisUtils = require("esri/arcgis/utils");
import esriConfig = require("esri/config");

// Specify CORS enabled servers.
[
  "www.wsdot.wa.gov",
  "wsdot.wa.gov",
  "data.wsdot.wa.gov",
  "gispublic.dfw.wa.gov"
].forEach(svr => {
  esriConfig.defaults.io.corsEnabledServers.push(svr);
});
// Since CORS servers are explicitly specified, CORS detection is not necessary.
// This prevents the following types of errors from appearing in the console:
// XMLHttpRequest cannot load http://example.com/ArcGIS/rest/info?f=json. No 'Access-Control-Allow-Origin' header is present on the requested resource. Origin 'http://example.com' is therefore not allowed access.
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
```

`index.html`
```html
<!DOCTYPE html>
<html xmlns="http://www.w3.org/1999/xhtml">
<head>
    <title>Buffer UI Demo</title>
    <meta http-equiv="Content-Type" content="text/html;charset=UTF-8">
    <link rel="stylesheet" href="https://js.arcgis.com/3.24/esri/css/esri.css" />
    <link href="Styles/index.css" rel="stylesheet" />
</head>
<body>
    <div id="flexcontainer">
        <div id="mapContainer">
            <div id="map"></div>
        </div>
        <div id="tools">
            <div id="buffer"></div>
        </div>
    </div>
    <div id="githubLink">
        <a href="https://github.com/WSDOT-GIS/arcgis-js-buffer/" target="_blank">Source on GitHub</a>
    </div>
    <script>
        (function(root) {
            var dojoConfig = {
                async: true,
                packages: [
                    {
                        name: "app",
                        location: root + "/dist",
                        main: "index"
                    }
                ]

            };
            window.dojoConfig = dojoConfig;
        }(location.pathname.replace(/\/[^\/]*$/, "")));
    </script>
    <script src="https://js.arcgis.com/3.24/"></script>
    <script>require(["app"]);</script>
</body>
</html>

```

`webpack.config.js`

This webpack config is almost identical to [Webpack's TypeScript guide](https://webpack.js.org/guides/typescript/).

```JavaScript
const path = require('path');

module.exports = {
  mode: "production",
  entry: './src/index.ts',
  module: {
    rules: [
      {
        test: /\.tsx?$/,
        use: 'ts-loader',
        exclude: /node_modules/
      }
    ]
  },
  resolve: {
    extensions: [ '.tsx', '.ts', '.js' ]
  },
  output: {
    filename: 'index.js',
    path: path.resolve(__dirname, 'dist'),
    // Modified output to be umd
    libraryTarget: "umd"
  },
  // Instructs webpack to ignore the ArcGIS JS API modules.
  externals: /^(esri)/
};
```