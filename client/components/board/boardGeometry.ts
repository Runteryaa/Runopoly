export const BOARD_SIZE = 1000;
export const CORNER_SIZE = 130;
export const TILE_WIDTH = (BOARD_SIZE - CORNER_SIZE * 2) / 9;

export interface TileBounds {
  x: number;
  y: number;
  width: number;
  height: number;
  rotation: number;
  centerX: number;
  centerY: number;
}

export function getTileBounds(id: number): TileBounds {
  if (id === 0) {
    // GO (bottom right)
    return {
      x: BOARD_SIZE - CORNER_SIZE,
      y: BOARD_SIZE - CORNER_SIZE,
      width: CORNER_SIZE,
      height: CORNER_SIZE,
      rotation: 0,
      centerX: BOARD_SIZE - CORNER_SIZE / 2,
      centerY: BOARD_SIZE - CORNER_SIZE / 2,
    };
  }
  if (id > 0 && id < 10) {
    // Bottom edge (1..9, right to left)
    const offset = 9 - id;
    const x = CORNER_SIZE + offset * TILE_WIDTH;
    const y = BOARD_SIZE - CORNER_SIZE;
    return {
      x,
      y,
      width: TILE_WIDTH,
      height: CORNER_SIZE,
      rotation: 0,
      centerX: x + TILE_WIDTH / 2,
      centerY: y + CORNER_SIZE / 2,
    };
  }
  if (id === 10) {
    // Jail (bottom left)
    return {
      x: 0,
      y: BOARD_SIZE - CORNER_SIZE,
      width: CORNER_SIZE,
      height: CORNER_SIZE,
      rotation: 0,
      centerX: CORNER_SIZE / 2,
      centerY: BOARD_SIZE - CORNER_SIZE / 2,
    };
  }
  if (id > 10 && id < 20) {
    // Left edge (11..19, bottom to top)
    const offset = 19 - id;
    const x = 0;
    const y = CORNER_SIZE + offset * TILE_WIDTH;
    return {
      x,
      y,
      width: CORNER_SIZE,
      height: TILE_WIDTH,
      rotation: 90,
      centerX: CORNER_SIZE / 2,
      centerY: y + TILE_WIDTH / 2,
    };
  }
  if (id === 20) {
    // Free Parking (top left)
    return {
      x: 0,
      y: 0,
      width: CORNER_SIZE,
      height: CORNER_SIZE,
      rotation: 0,
      centerX: CORNER_SIZE / 2,
      centerY: CORNER_SIZE / 2,
    };
  }
  if (id > 20 && id < 30) {
    // Top edge (21..29, left to right)
    const offset = id - 21;
    const x = CORNER_SIZE + offset * TILE_WIDTH;
    const y = 0;
    return {
      x,
      y,
      width: TILE_WIDTH,
      height: CORNER_SIZE,
      rotation: 180,
      centerX: x + TILE_WIDTH / 2,
      centerY: CORNER_SIZE / 2,
    };
  }
  if (id === 30) {
    // Go To Jail (top right)
    return {
      x: BOARD_SIZE - CORNER_SIZE,
      y: 0,
      width: CORNER_SIZE,
      height: CORNER_SIZE,
      rotation: 0,
      centerX: BOARD_SIZE - CORNER_SIZE / 2,
      centerY: CORNER_SIZE / 2,
    };
  }
  // Right edge (31..39, top to bottom)
  const offset = id - 31;
  const x = BOARD_SIZE - CORNER_SIZE;
  const y = CORNER_SIZE + offset * TILE_WIDTH;
  return {
    x,
    y,
    width: CORNER_SIZE,
    height: TILE_WIDTH,
    rotation: 270,
    centerX: BOARD_SIZE - CORNER_SIZE / 2,
    centerY: y + TILE_WIDTH / 2,
  };
}
