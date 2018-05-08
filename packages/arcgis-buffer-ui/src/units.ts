// Define the available units. See https://developers.arcgis.com/javascript/jsapi/bufferparameters-amd.html#unit

export interface IUnit {
  name: string;
  value: number;
  description: string;
}

const units: IUnit[] = [
  {
    name: "50KilometerLength",
    value: 109030,
    description: "50 Kilometer Length"
  },
  {
    name: "150KilometerLength",
    value: 109031,
    description: "150 Kilometer Length"
  },
  { name: "Kilometer", value: 9036, description: "Kilometer" },
  { name: "Decimeter", value: 109005, description: "Decimeter" },
  { name: "Meter", value: 9001, description: "International Meter" },
  { name: "Centimeter", value: 109006, description: "Centimeter" },
  { name: "Millimeter", value: 109007, description: "Millimeter" },

  {
    name: "NauticalMile",
    value: 9030,
    description: "International nautical mile"
  },
  { name: "SurveyMile", value: 9035, description: "US survey mile" },
  { name: "StatuteMile", value: 9093, description: "Statute Mile" },
  { name: "InternationalYard", value: 9096, description: "International Yard" },
  { name: "SurveyYard", value: 109002, description: "US survey Yard" },
  { name: "InternationalRod", value: 109010, description: "International rod" },
  { name: "USsurveyRod", value: 109011, description: "US survey rod" },
  {
    name: "InternationalChain",
    value: 9097,
    description: "International Chain"
  },
  { name: "SurveyChain", value: 9033, description: "US survey chain" },
  { name: "Foot", value: 9002, description: "International Foot" },
  { name: "SurveyFoot", value: 9003, description: "US survey foot" },
  { name: "InternationalLink", value: 9098, description: "International Link" },
  { name: "SurveyLink", value: 9034, description: "US survey link" },
  {
    name: "InternationalInch",
    value: 109008,
    description: "International Inch"
  },
  { name: "USsurveyInch", value: 109009, description: "US survey inch" }

  // { "name": "GermanMeter", "value": 9031, "description": "German legal meter" },
  // { "name": "ClarkeFoot", "value": 9005, "description": "Clarke's foot" },
  // { "name": "Fathom", "value": 9014, "description": "Fathom" },
  // { "name": "ClarkeYard", "value": 9037, "description": "Yard (Clarke's ratio)" },
  // { "name": "ClarkeChain", "value": 9038, "description": "Chain (Clarke's ratio)" },
  // { "name": "ClarkeLink", "value": 9039, "description": "Link (Clarke's ratio)" },
  // { "name": "SearsYard", "value": 9040, "description": "Yard (Sears)" },
  // { "name": "SearsFoot", "value": 9041, "description": "Sears' foot" },
  // { "name": "SearsChain", "value": 9042, "description": "Chain (Sears)" },
  // { "name": "SearsLink", "value": 9043, "description": "Link (Sears)" },
  // { "name": "Benoit1895A_Yard", "value": 9050, "description": "Yard (Benoit 1895 A)" },
  // { "name": "Benoit1895A_Foot", "value": 9051, "description": "Foot (Benoit 1895 A)" },
  // { "name": "Benoit1895A_Chain", "value": 9052, "description": "Chain (Benoit 1895 A)" },
  // { "name": "Benoit1895A_Link", "value": 9053, "description": "Link (Benoit 1895 A)" },
  // { "name": "Benoit1895B_Yard", "value": 9060, "description": "Yard (Benoit 1895 B)" },
  // { "name": "Benoit1895B_Foot", "value": 9061, "description": "Foot (Benoit 1895 B)" },
  // { "name": "Benoit1895B_Chain", "value": 9062, "description": "Chain (Benoit 1895 B)" },
  // { "name": "Benoit1895B_Link", "value": 9063, "description": "Link (Benoit 1895 B)" },
  // { "name": "IndianFoot", "value": 9080, "description": "Indian geodetic foot" },
  // { "name": "Indian1937Foot", "value": 9081, "description": "Indian foot (1937)" },
  // { "name": "Indian1962Foot", "value": 9082, "description": "Indian foot (1962)" },
  // { "name": "Indian1975Foot", "value": 9083, "description": "Indian foot (1975)" },
  // { "name": "IndianYard", "value": 9084, "description": "Indian yard" },
  // { "name": "Indian1937Yard", "value": 9085, "description": "Indian yard (1937)" },
  // { "name": "Indian1962Yard", "value": 9086, "description": "Indian yard (1962)" },
  // { "name": "Indian1975Yard", "value": 9087, "description": "Indian yard (1975)" },
  // { "name": "Foot1865", "value": 9070, "description": "Foot (1865)" },
  // { "name": "Radian", "value": 9101, "description": "Radian" },
  // { "name": "Degree", "value": 9102, "description": "Degree" },
  // { "name": "ArcMinute", "value": 9103, "description": "Arc-minute" },
  // { "name": "ArcSecond", "value": 9104, "description": "Arc-second" },
  // { "name": "Grad", "value": 9105, "description": "Grad" },
  // { "name": "Gon", "value": 9106, "description": "Gon" },
  // { "name": "Microradian", "value": 9109, "description": "Microradian" },
  // { "name": "ArcMinuteCentesimal", "value": 9112, "description": "Centesimal arc-minute" },
  // { "name": "ArcSecondCentesimal", "value": 9113, "description": "Centesimal arc-second" },
  // { "name": "Mil6400", "value": 9114, "description": "Mil" },
  // { "name": "British1936Foot", "value": 9095, "description": "British Foot (1936)" },
  // { "name": "GoldCoastFoot", "value": 9094, "description": "Gold Coast Foot" },
  // { "name": "USNauticalMile", "value": 109012, "description": "US nautical mile (pre-1954)" },
  // { "name": "UKNauticalMile", "value": 109013, "description": "UK nautical mile (pre-1970)" }
];

export function unitToOption(unit: IUnit) {
  const option = document.createElement("option");
  option.value = unit.value.toString(10);
  option.textContent = unit.description;
  option.dataset.name = unit.name;
  return option;
}

/**
 * Creates the contents of a unit <select>.
 * @param {string} [defaultName] - The name of the measurment unit that will be set as the default.
 * @returns {DocumentFragment}
 */
export function createUnitSelectContents(
  defaultName: string
): DocumentFragment {
  if (!defaultName) {
    defaultName = "Foot";
  }
  const frag = document.createDocumentFragment();
  function createGroup(label: string) {
    const group = document.createElement("optgroup");
    group.label = label;
    frag.appendChild(group);
    return group;
  }
  const metricGroup = createGroup("Metric");
  const usCustomaryGroup = createGroup("US Customary");
  // var internationalGroup = createGroup("International");
  //// var usSurveyGroup = createGroup("US Survey");
  //// var nauticalGroup = createGroup("Nautical");
  //// var arcGroup = createGroup("Arc");
  //// var clarkesGroup = createGroup("Clarke's");
  //// var searsGroup = createGroup("Sears");
  //// var indianGroup = createGroup("Indian");
  //// var benoitGroup = createGroup("Benoit");

  const metricRe = /met(?:(?:er)|(?:re))/i;
  const usCustomaryRe = /\b(?:(?:point)|(?:pica)|(?:inch)|(?:link)|(?:f[eo]{2}t)|(?:rod)|(?:chain)|(?:furlong)|(?:yard)|(?:mile)|(?:league)|(?:fathom)|(?:cable))\b/i;
  // var nauticalRe = /nautical/i;
  // var usSurveyRe = /US\sSurvey/i;
  // var internationalRe = /International/i;
  // var arcRe = /\barc\b/i;
  // var clarkesRe = /Clarke/i;
  // var searsRe = /Sears/i;
  // var indianRe = /Indian/i;
  // var benoitRe = /Benoit/i;

  units.forEach(unit => {
    const option = unitToOption(unit);
    if (unit.name === defaultName) {
      option.selected = true;
    }
    if (metricRe.test(unit.description)) {
      metricGroup.appendChild(option);
    } else if (usCustomaryRe.test(unit.description)) {
      usCustomaryGroup.appendChild(option);
      //// } else if (arcRe.test(unit.description)) {
      //// 	arcGroup.appendChild(option);
      //// } else if (clarkesRe.test(unit.description)) {
      //// 	clarkesGroup.appendChild(option);
      //// } else if (searsRe.test(unit.description)) {
      //// 	searsGroup.appendChild(option);
      //// } else if (indianRe.test(unit.description)){
      //// 	indianGroup.appendChild(option);
      //// } else if (benoitRe.test(unit.description)) {
      //// 	benoitGroup.appendChild(option);
      //// } else if (nauticalRe.test(unit.description)) {
      //// 	nauticalGroup.appendChild(option);
      //// } else if (usSurveyRe.test(unit.description)) {
      //// 	usSurveyGroup.appendChild(option);
      //// } else if (internationalRe.test(unit.description)) {
      //// 	internationalGroup.appendChild(option);
    } else {
      frag.appendChild(option);
    }
  });
  return frag;
}

export function createUnitSelect(defaultName: string) {
  const frag = createUnitSelectContents(defaultName);
  const select = document.createElement("select");
  select.appendChild(frag);
  return select;
}

/**
 * Returns the unit that matches the given unit ID.
 * @returns {Unit}
 */
export function getUnitForId(unitId: number | string): IUnit {
  let output: IUnit | undefined;
  if (typeof unitId === "number" || typeof unitId === "string") {
    for (const unit of units) {
      if (
        (typeof unitId === "number" && unit.value === unitId) ||
        (typeof unitId === "string" &&
          (unit.name === unitId || unit.description === unitId))
      ) {
        output = unit;
        break;
      }
    }
  }
  if (!output) {
    throw new Error(`Invalid Unit ID: ${unitId}`);
  }
  return output;
}
