const wall = '[class*="_backWall_"]';
const grid = 'svg[class*="_grid_"]';
const fine = 'svg[class*="_fineGrid_"]';

export type RoomStaticCase = Readonly<{
  target: string;
  selector: string;
  property?: string;
  attribute?: string;
  colorChannel?: boolean;
  prerequisite?: string;
  direction?: -1 | 1;
}>;

// Observe rendered geometry/style, not transport settings or panel labels.
export const roomStaticCases: readonly RoomStaticCase[] = [
  { target: "composition.firstRowScale", selector: '[class*="_firstRow_"]', property: "font-size" },
  { target: "composition.secondRowScale", selector: '[class*="_secondRow_"]', property: "font-size" },
  { target: "composition.lineGap", selector: '[class*="_secondRow_"]', property: "margin-top" },
  { target: "composition.buttonGap", selector: '[class*="_compositionButton_"]', property: "margin-top" },
  { target: "room.depth", selector: wall, property: "width" },
  { target: "room.wallBorder.width", selector: wall, property: "border-left-width" },
  { target: "room.innerGrid.depth", selector: '[data-studio-room-inner-grid] linearGradient:first-child', attribute: "y2", prerequisite: "room.innerGrid.enabled" },
  { target: "room.innerGrid.falloff", selector: '[data-studio-room-inner-grid] linearGradient:first-child stop:nth-child(3)', attribute: "stop-color", colorChannel: true, prerequisite: "room.innerGrid.enabled", direction: -1 },
  { target: "room.innerGrid.opacity", selector: '[data-studio-room-inner-grid] > g', attribute: "opacity", prerequisite: "room.innerGrid.enabled" },
  { target: "grid.columns", selector: `${grid} line` },
  { target: "grid.rows", selector: `${grid} line` },
  { target: "grid.depthDivisions", selector: `${grid} rect` },
  { target: "grid.opacity", selector: `${grid} > g`, property: "opacity" },
  { target: "grid.thickness", selector: `${grid} > g`, property: "stroke-width" },
  { target: "fineGrid.subdivision", selector: `${fine} line` },
  { target: "fineGrid.opacity", selector: `${fine} > g`, property: "opacity" },
  { target: "fineGrid.thickness", selector: `${fine} > g`, property: "stroke-width" },
  { target: "tiles.perSurface", selector: '[class*="_tileSlot_"]' },
  { target: "tiles.fog", selector: `${grid} > g > g`, attribute: "opacity", direction: -1 },
];
