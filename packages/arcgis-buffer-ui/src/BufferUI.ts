/**
 * This module defines the user interface.
 */

import { Feature as Graphic, Geometry } from "arcgis-rest-api";
import { createUnitSelectContents, getUnitForId } from "./units";

/**
 * This interface is for objects that may or may not have a toJson function.
 * Intended for use as an Intersection Type along with arcgis-rest-api Geometry
 * For instances that may be either a basic object representing a geometry or
 * a specialized ArcGIS API Geometry object.
 */
export interface IMayHaveToJson {
  /**
   * ArcGIS API object will have a toJson function that converts it to a standard JavaScript object.
   */
  toJson?: () => any;
}

/**
 * The distance input can have either a single number or a comma separated
 * list of numbers. This Regex will match valid values for that control.
 */
const distancesPattern = /\d+(?:\.\d+)?([,\s]+\d+(?:\.\d+)?)*/;

/**
 * The HTML markup for the input form.
 */
const template = `<form class="buffer-ui">
<div>
	<label>Distances</label>
  <input name="distances" placeholder="e.g 200,300" pattern="${
    distancesPattern.source
  }" title="Must be a number or list of numbers." required="required" />
</div>
<div>
	<label>Measurement Unit</label>
	<select name="unit"></select>
</div>
<fieldset>
	<label>Geometries</label>
	<ul class="geometry-list"></ul>
	<button class="clear-geometries" type="button">Clear Geometries</button>
</fieldset>
<fieldset>
	<ul class="buffer-options-list">
		<li><label><input type="checkbox" name="union" />Union results</label></li>
	</ul>
</fieldset>
<div>
	<button type="submit">Buffer</button>
</div>
<div>
	<label>Results Layer</label>
	<button type="button" class="clear-result-graphics-button">Clear result graphics</button>
</div>
</form>`;

/**
 * Converts the template HTML markup string into an HTML DOM element,
 * then clones its form.
 * @param {string} templateMarkup - HTML markup string.
 * @returns {HTMLFormElement}
 */
function getFormFromTemplate(templateMarkup: string): HTMLFormElement {
  const form = document.createElement("form");
  form.innerHTML = template;
  const unitSelect = form.unit as HTMLSelectElement;
  unitSelect.appendChild(createUnitSelectContents("Foot"));
  return form;
}

/**
 * If given a graphic object, returns its geometry property.
 * If given a geometry object, simply returns the input object.
 * @param featureOrGeometry A graphic or geometry object.
 * @throws {TypeError} Thrown if the input object is neither a geometry nor contains a geometry.
 */
function getGeometry(featureOrGeometry: Graphic | Geometry) {
  if ((featureOrGeometry as Graphic).geometry) {
    return (featureOrGeometry as Graphic).geometry;
  } else if (
    featureOrGeometry.hasOwnProperty("x") ||
    featureOrGeometry.hasOwnProperty("points") ||
    featureOrGeometry.hasOwnProperty("rings") ||
    featureOrGeometry.hasOwnProperty("paths")
  ) {
    return featureOrGeometry as Geometry;
  }
  throw new TypeError("Input must be a Graphic or Geometry");
}

/**
 * The *detail* of a *buffer* CustomEvent.
 */
export interface IBufferEventDetail {
  /**
   * The geometry or geometries to be buffered.
   */
  geometry: Geometry | Geometry[] | null;
  /**
   * The distance(s) around each geometry to buffer.
   */
  distance: number | number[] | null;
  /**
   * Measurement unit.
   * @see https://developers.arcgis.com/javascript/jsapi/bufferparameters-amd.html#unit
   */
  unit: number;
  /**
   * Boolean value indicating that the output buffer geometries should be unioned.
   */
  unionResults: boolean;
}

/**
 * UI for the Buffer operation on an ArcGIS Server Geometry service.
 * @class
 */
export default class BufferUI {
  /**
   * The HTML form that the user interacts with.
   *
   * This form emits the following CustomEvents.
   *
   * * buffer - This event is emitted when a user submits the form with valid values. The detail property of this event is an IBufferEventDetail.
   * * clear-graphics - This event is emitted when the user clicks the "Clear Graphics" button.
   */
  public form: HTMLFormElement;
  /**
   * Creates a new instance of BufferUI
   * @param root The HTML element that will contain the HTML form of this control.
   */
  constructor(public root: HTMLElement) {
    const self = this;
    const form = getFormFromTemplate(template);

    this.root.appendChild(form);
    this.form = form;

    form.onsubmit = () => {
      const geometries = { self };
      if (geometries) {
        const evt = new CustomEvent<IBufferEventDetail>("buffer", {
          detail: {
            geometry: self.geometries,
            distance: self.distances,
            unit: self.unit,
            unionResults: self.unionResults
          }
        });
        form.dispatchEvent(evt);
      }
      return false;
    };

    const clearGeometriesButton = this.root.querySelector<HTMLButtonElement>(
      "button.clear-geometries"
    )!;
    clearGeometriesButton.onclick = () => {
      self.clearGeometryList();
    };

    const clearGraphicsButton = this.root.querySelector<HTMLButtonElement>(
      "button.clear-result-graphics-button"
    )!;
    clearGraphicsButton.onclick = () => {
      const evt = new CustomEvent("clear-graphics");
      form.dispatchEvent(evt);
    };

    this.form = form;

    this.root.appendChild(form);
  }

  /**
   * Gets the distances entered in the distances box.
   */
  public get distances(): number | number[] | null {
    let distances = null;
    const s: string = this.form.distances.value;
    if (s) {
      distances = s.split(/[,\s]+/).map(st => {
        return parseFloat(st);
      });
    }
    if (distances && distances.length === 1) {
      return distances[0];
    }
    return distances;
  }

  /**
   * Adds a feature to the UI's list.
   * @param feature A feature
   */
  public addFeature(feature: Graphic) {
    const list = this.root.querySelector(".geometry-list")!;
    const li = document.createElement("li");

    let geometry = getGeometry(feature) as Geometry & IMayHaveToJson;
    if (geometry.toJson) {
      geometry = geometry.toJson();
    }
    li.dataset.geometry = JSON.stringify(geometry);
    // TODO: If input is a feature, make the list item's text content more descriptive of the feature using its properties.
    li.textContent = "Geometry";
    list.appendChild(li);
  }

  /**
   * Gets all of the geometries stored in the list items' data-geometry attributes
   */
  public get geometries(): Geometry | Geometry[] | null {
    const geometries = new Array<Geometry>();
    const listItems = this.root.querySelectorAll<HTMLLIElement>(
      ".geometry-list > li"
    );
    for (const li of listItems.values()) {
      const gJson = li.dataset.geometry!;
      const g = JSON.parse(gJson);
      geometries.push(g);
    }
    if (geometries.length < 1) {
      return null;
    } else if (geometries.length === 1) {
      return geometries[0];
    }
    return geometries;
  }

  /**
   * Returns an integer representing a measurement unit.
   */
  public get unit() {
    return parseInt(this.form.unit.value, 10);
  }

  /**
   * Returns a boolean value indicating if the union checkbox is currently checked.
   */
  public get unionResults() {
    return Boolean(this.form.querySelector("[name=union]:checked"));
  }

  /**
   * Clears the list of geometries in the UI.
   */
  public clearGeometryList() {
    const ul = this.root.querySelector(".geometry-list")!;
    ul.innerHTML = "";
  }
}
