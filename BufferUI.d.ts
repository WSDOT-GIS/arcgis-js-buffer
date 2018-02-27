import Graphic = require("esri/graphic");
import Geometry = require("esri/geometry/Geometry");

/**
 * UI for the Buffer operation on an ArcGIS Server Geometry service.
 */
declare class BufferUI {
    root: HTMLElement;
    form: HTMLFormElement;
    constructor(domNode: HTMLElement);
    /**
     * Gets the distances entered in the distances box.
     */
    getDistances(): number[];
    addFeature(feature: Graphic | Geometry): void;
    getGeometries(): Geometry[];
    clearGeometryList(): void;
}

export = BufferUI;