import Geometry = require("esri/geometry/Geometry");
import Graphic = require("esri/graphic");
import { createUnitSelectContents, getUnitForId } from "./units";

const distancesPattern = /\d+(?:\.\d+)?([,\s]+\d+(?:\.\d+)?)*/;

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
 * UI for the Buffer operation on an ArcGIS Server Geometry service.
 * @class
 */
export default class BufferUI {
  public form: HTMLFormElement;
  constructor(public root: HTMLElement) {
    const self = this;
    const form = getFormFromTemplate(template);

    this.root.appendChild(form);
    this.form = form;

    form.onsubmit = () => {
      const geometries = self.getGeometries();
      if (geometries) {
        const evt = new CustomEvent("buffer", {
          detail: {
            geometry: self.getGeometries(),
            distance: self.getDistances(),
            unit: parseInt(self.form.unit.value, 10),
            unionResults: Boolean(
              self.form.querySelector("[name=union]:checked")
            )
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
  public getDistances() {
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

  public addFeature(feature: Graphic) {
    const list = this.root.querySelector(".geometry-list")!;
    const li = document.createElement("li");

    function getGeometry(featureOrGeometry: Graphic | Geometry) {
      if ((featureOrGeometry as Graphic).geometry) {
        return (featureOrGeometry as Graphic).geometry;
      } else if (
        featureOrGeometry.hasOwnProperty("x") ||
        featureOrGeometry.hasOwnProperty("points") ||
        featureOrGeometry.hasOwnProperty("rings") ||
        featureOrGeometry.hasOwnProperty("paths")
      ) {
        return featureOrGeometry;
      }
      throw new TypeError("Input must be a Graphic or Geometry");
    }

    let geometry = getGeometry(feature);
    if (geometry.toJson) {
      geometry = geometry.toJson();
    }
    li.dataset.geometry = JSON.stringify(geometry);
    // TODO: If input is a feature, make the list item's text content more descriptive of the feature using its properties.
    li.textContent = "Geometry";
    list.appendChild(li);
  }

  public getGeometries() {
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

  public clearGeometryList() {
    const ul = this.root.querySelector(".geometry-list")!;
    ul.innerHTML = "";
  }
}
