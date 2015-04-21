/*global define*/
define([
	"esri/graphic",
	"esri/geometry/jsonUtils",
	"esri/layers/FeatureLayer",
	"esri/dijit/PopupTemplate",
	"./units",
	"esri/geometry/geometryEngineAsync"], function (
		 Graphic, geometryJsonUtils, FeatureLayer, PopupTemplate, Unit, geometryEngineAsync
		) {
	/**
	 * Adds a "buffer" link to an InfoWindow.
	 * When clicked it will add the selected feature
	 * to the BufferUI geometries list.
	 * @param {esri/widget/InfoWindow} infoWindow
	 * @param {BufferUI} bufferUI
	 */
	function addBufferLink(infoWindow, bufferUI) {
		var actionList = infoWindow.domNode.querySelector(".actionList");
		var link = document.createElement("a");
		var docFrag = document.createDocumentFragment();
		link.textContent = "Buffer";
		link.href = "#";
		link.title = "Add selected geometry to Buffer UI list";
		link.classList.add("action");
		link.classList.add("buffer");
		// Add a space before adding link.
		docFrag.appendChild(document.createTextNode(" "));
		docFrag.appendChild(link);

		link.onclick = function () {
			var feature = infoWindow.features[infoWindow.selectedIndex];
			bufferUI.addFeature(feature);

			return false;
		};

		actionList.appendChild(docFrag);
		return link;
	}

	/**
	 * Creates a feature layer and adds it to the map.
	 * @returns {BufferFeatureLayer}
	 */
	function attachBufferUIToMap(/**{esri/Map}*/ map, /**{BufferUI}*/ buffer, /**{string}*/layerId) {
		var bufferFeatureLayer, oid = 0, popupTemplate;

		popupTemplate = new PopupTemplate({
			title: "Buffer",
			fieldInfos: [
				{
					fieldName: "distance",
					label: "Buffer Distance",
					visible: true,
					format: {
						places: 0,
						digitSeparator: true
					},

				},
				{
					fieldName: "unit",
					label: "Measurement Unit",
					visible: true,
				},
				{
					fieldName: "area",
					label: "Area",
					visible: true,
					format: {
						places: 0,
						digitSeparator: true
					},
				},
				{
					fieldName: "areaUnit",
					label: "Area Unit",
					visible: true
				}
			]
		});


		bufferFeatureLayer = new FeatureLayer({
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
		}, {
			id: layerId || "Buffer",
			className: "buffer"
		});

		bufferFeatureLayer.setInfoTemplate(popupTemplate);


		map.addLayer(bufferFeatureLayer);

		addBufferLink(map.infoWindow, buffer);

		buffer.form.addEventListener('clear-graphics', function () {
			bufferFeatureLayer.clear();
		});

		buffer.form.addEventListener("buffer", function (e) {
			var detail = e.detail;

			// Convert regular objects into esri/Geometry objects.
			if (Array.isArray(detail.geometry)) {
				detail.geometry = detail.geometry.map(geometryJsonUtils.fromJson, detail.geometry);
			} else {
				detail.geometry = geometryJsonUtils.fromJson(detail.geometry);
			}

			// The geometry engine requires that the number of geometries and distances be the same.
			// If multiple distances are provided but only a single geometry, that geometry will be
			// buffered for each distance.
			if (Array.isArray(detail.distance) && !Array.isArray(detail.geometry)) {
				detail.geometry = (function () {
					var outGeoArray = [];
					for (var i = 0, l = detail.distance.length; i < l; i += 1) {
						outGeoArray[i] = detail.geometry;
					}
					return outGeoArray;
				}());
			} else if (!Array.isArray(detail.distance) && Array.isArray(detail.geometry)) {
				detail.distance = (function () {
					var outDistanceArray = [];
					for (var i = 0; i < detail.geometry.length; i++) {
						outDistanceArray[i] = detail.distance;
					}
					return outDistanceArray;
				}());
			}

			geometryEngineAsync.buffer(detail.geometry, detail.distance, detail.unit, detail.unionResults).then(function (bufferResults) {
				console.log("buffer results", bufferResults);
				var unit = Unit.getUnitForId(detail.unit);
				unit = unit.description;
				var areaUnit = "esriSquareFeet";
				var promises = [];
				if (bufferResults) {
					bufferFeatureLayer.suspend();
					if (!Array.isArray(bufferResults)) {
						bufferResults = [bufferResults];
					}
					bufferResults.forEach(function (geometry, i) {
						var promise = geometryEngineAsync.geodesicArea(geometry, areaUnit).then(function (area) {
							var acres = area / 43560;
							var graphic = new Graphic(geometry, null, {
								oid: oid++,
								distance: Array.isArray(detail.distance) ? detail.distance[i] : detail.distance,
								unit: unit,
								unioned: detail.unionResults,
								area: acres <= 1 ? area : acres,
								areaUnit: acres <= 1 ? "ft\u00b2" : "acres"
							});
							bufferFeatureLayer.applyEdits([graphic]);
						}, function (error) {
							var graphic = new Graphic(geometry, null, {
								oid: oid++,
								distance: Array.isArray(detail.distance) ? detail.distance[i] : detail.distance,
								unit: unit,
								unioned: detail.unionResults,
								areaError: error
							});
							bufferFeatureLayer.applyEdits([graphic]);
						});
						promises.push(promise);
					});
					Promise.all(promises).then(function () {
						bufferFeatureLayer.resume();
					}, function () {
						bufferFeatureLayer.resume();
					});
				}
				buffer.clearGeometryList();
			}, function (error) {
				console.error("buffer error", error);
			});
		});

		return bufferFeatureLayer;
	}

	return {
		addBufferLink: addBufferLink,
		attachBufferUIToMap: attachBufferUIToMap
	};
});