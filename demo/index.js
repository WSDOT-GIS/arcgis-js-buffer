
/*global require*/
require([
	"esri/arcgis/utils",
	"esri/config",
	"BufferUI",
	"BufferUI/BufferUIHelper"
], function (arcgisUtils, esriConfig, BufferUI, BufferUIHelper) {
	"use strict";
	var buffer;

	// Specify CORS enabled servers.
	["www.wsdot.wa.gov", "wsdot.wa.gov", "gispublic.dfw.wa.gov"].forEach(function (svr) {
		esriConfig.defaults.io.corsEnabledServers.push(svr);
	});
	// Since CORS servers are explicitly specified, CORS detection is not necessary.
	// This prevents the following types of errors from appearing in the console:
	// XMLHttpRequest cannot load http://gis.rita.dot.gov/ArcGIS/rest/info?f=json. No 'Access-Control-Allow-Origin' header is present on the requested resource. Origin 'http://example.com' is therefore not allowed access.
	esriConfig.defaults.io.corsDetection = false;

	// Create the Buffer UI in the specified node.
	buffer = new BufferUI(document.getElementById("buffer"));

	// Create a map from a predefined webmap on AGOL.
	arcgisUtils.createMap("927b5daaa7f4434db4b312364489544d", "map").then(function (response) {
		var map = response.map;
		var layerId;

		// Setup the Buffer UI with the map.
		BufferUIHelper.attachBufferUIToMap(map, buffer);

		// Turn on some layers that are off by default.
		(function () {
			var airportRe = /^((Airport)|(CityLimits))/i, layer;
			for (var i = 0, l = map.layerIds.length; i < l; i += 1) {
				layerId = map.layerIds[i];
				if (airportRe.test(layerId)) {
					layer = map.getLayer(layerId);
					layer.show();
				}
			}
		}());

	});
});