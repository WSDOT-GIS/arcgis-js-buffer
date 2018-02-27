declare interface IUnit {
  name: string;
  value: number;
  description: string;
}

declare class Unit implements IUnit {
  name: string;
  value: number;
  description: string;
  static createUnitSelect(defaultName: string): HTMLSelectElement;
  static createUnitSelectContents(defaultName: string): DocumentFragment;
  static readonly units: Unit[];
  /**
   * Returns the unit that matches the given unit ID.
   */
  static getUnitForId(unitId: number): Unit;
  constructor(o: IUnit);
  toOption(): HTMLOptionElement;
}
