import { RandomGenerator } from '../util/random'
import { images } from '../app/load_resources'
import { TILE_SIZE, TILESET_POINT_PER_PIXEL } from '../segments/constants'
import { drawSegmentImage } from './view'
import store from '../store'

const MAX_CANVAS_HEIGHT = 2048

const BUILDING_DESTINATION_SCREEN = 1
export const BUILDING_DESTINATION_THUMBNAIL = 2

export const BUILDING_SPACE = 360

export const MAX_BUILDING_HEIGHT = 20

export const GROUND_BASELINE_HEIGHT = 44

// TODO: default overhang should just be 0
const OVERHANG_WIDTH = 25

/**
 * Define buildings here. Properties:
 *
 * -- IDENTITY --
 * id         id used in street data
 * label      label to display (English fallback)
 * spriteId   sprite id prefix, should append `-left` or `-right` to this unless
 *            `sameOnBothSides` is true
 *
 * -- CHARACTERISTICS --
 * hasFloors        (boolean) true if building can have multiple floors
 * sameOnBothSides  (boolean) true if the same sprite is used both sides of the street
 * repeatHalf       (boolean) true if half of the sprite is repeating and the other half anchors to street edge
 *                            todo: better property name
 * alignAtBaseline  (boolean) true if bottom of sprite should be anchored at baseline rather than ground plane
 *
 * -- SPECIFICATIONS --
 * variantsCount    (number) actually, not sure
 * mainFloorHeight  (number) in feet, how tall is the ground floor
 *                            todo: use pixel heights for these?
 * floorHeight      (number) in feet, how tall are intermediate floors (which can repeat)
 * roofHeight       (number) in feet, how tall is the roof structure
 * overhangWidth    (number) in ??, amount to overhang the sidewalk (adjusts OVERHANG_WIDTH)
 */
export const BUILDINGS = {
  'grass': {
    id: 'grass',
    label: 'Grass',
    spriteId: 'buildings--grass',
    hasFloors: false,
    sameOnBothSides: true
  },
  'fence': {
    id: 'fence',
    label: 'Empty lot',
    spriteId: 'buildings--fenced-lot',
    hasFloors: false
  },
  'parking-lot': {
    id: 'parking-lot',
    label: 'Parking lot',
    spriteId: 'buildings--parking-lot',
    hasFloors: false,
    repeatHalf: true
  },
  'waterfront': {
    id: 'waterfront',
    label: 'Waterfront',
    spriteId: 'buildings--waterfront',
    hasFloors: false,
    alignAtBaseline: true,
    repeatHalf: true
  },
  'residential': {
    id: 'residential',
    label: 'Home',
    spriteId: 'buildings--residential',
    hasFloors: true,
    variantsCount: 0,
    floorHeight: 10,
    roofHeight: 20,
    mainFloorHeight: 11.5
  },
  'narrow': {
    id: 'narrow',
    label: 'Building',
    spriteId: 'buildings--apartments-narrow',
    hasFloors: true,
    variantsCount: 1,
    floorHeight: 10,
    roofHeight: 2,
    mainFloorHeight: 14,
    overhangWidth: 9
  },
  'wide': {
    id: 'wide',
    label: 'Building',
    spriteId: 'buildings--apartments-wide',
    hasFloors: true,
    variantsCount: 1,
    floorHeight: 10,
    roofHeight: 2,
    mainFloorHeight: 14,
    overhangWidth: 5
  }
}

/**
 * Create sprite id given variant and position
 *
 * @param {string} variant
 * @param {string} position - either "left" or "right"
 * @returns {string}
 */
function getSpriteId (variant, position) {
  const building = BUILDINGS[variant]
  return building.spriteId + (building.sameOnBothSides ? '' : '-' + position)
}

/**
 * Calculate building image height. For buildings that do not have multiple floors, this
 * is just the image's intrinsic height value. For buildings with multiple floors, this
 * must be calculated from the number of floors and sprite pixel specifications.
 *
 * @param {string} variant
 * @param {string} position - either "left" or "right"
 * @param {Number} floors
 */
export function getBuildingImageHeight (variant, position, floors = 1) {
  const building = BUILDINGS[variant]
  let height

  if (building.hasFloors) {
    height = ((building.roofHeight + (building.floorHeight * (floors - 1)) + building.mainFloorHeight) * TILE_SIZE)
  } else {
    const id = getSpriteId(variant, position)
    const svg = images.get(id)
    height = svg.height / TILESET_POINT_PER_PIXEL
  }

  return height
}

/**
 * Converts the number of floors to an actual height in feet
 *
 * @param {string} variant
 * @param {string} position - "left" or "right"
 * @param {Number} floors
 * @returns {Number} height, in feet
 */
export function calculateRealHeightNumber (variant, position, floors) {
  const CURB_HEIGHT = 6
  return (getBuildingImageHeight(variant, position, floors) - CURB_HEIGHT) / TILE_SIZE
}

export function drawBuilding (ctx, destination, street, left, totalWidth, totalHeight, offsetLeft, multiplier, dpi) {
  const variant = left ? street.leftBuildingVariant : street.rightBuildingVariant
  const floors = left ? street.leftBuildingHeight : street.rightBuildingHeight
  const position = left ? 'left' : 'right'

  const building = BUILDINGS[variant]

  const spriteId = getSpriteId(variant, position)
  const svg = images.get(spriteId)

  const buildingHeight = getBuildingImageHeight(variant, position, floors)
  let offsetTop = totalHeight - (buildingHeight * multiplier)

  // Adjust offset if the building should be aligned at baseline instead of ground plane
  if (building.alignAtBaseline) {
    offsetTop += GROUND_BASELINE_HEIGHT
  }

  // Some building sprites tile itself, while others tile just half of it
  let width, x, lastX, firstX
  if (building.repeatHalf) {
    width = svg.width / TILESET_POINT_PER_PIXEL / 2 // 2 = halfway point is where repeat starts.

    if (position === 'left') {
      x = 0 // repeat the left half of this sprite
      lastX = svg.width / 2 // anchor the right half of this sprite
    } else {
      x = svg.width / 2 // repeat the right half of this sprite
      firstX = 0 // anchor the left half of this sprite
    }
  } else {
    width = svg.width / TILESET_POINT_PER_PIXEL
  }

  // Calculate overhang position
  const offsetLeftPos = building.overhangWidth || OVERHANG_WIDTH
  let leftPosShift
  if (position === 'left') {
    if (!building.hasFloors) {
      // takes into consideration tiling
      leftPosShift = (totalWidth % width) - (width + width + offsetLeftPos)
    } else {
      leftPosShift = totalWidth - (width + offsetLeftPos)
    }
  } else {
    leftPosShift = offsetLeftPos
  }

  // Multifloor buildings
  if (building.hasFloors) {
    const height = svg.height // actual pixels, don't need to divide by TILESET_POINT_PER_PIXEL

    // bottom floor
    drawSegmentImage(spriteId, ctx,
      0,
      height - (building.mainFloorHeight * TILE_SIZE * TILESET_POINT_PER_PIXEL), // 0 - 240 + (120 * building.variantsCount),
      undefined,
      building.mainFloorHeight * TILE_SIZE,
      offsetLeft + (leftPosShift * multiplier),
      offsetTop + ((buildingHeight - (building.mainFloorHeight * TILE_SIZE)) * multiplier),
      undefined,
      building.mainFloorHeight * TILE_SIZE,
      multiplier, dpi)

    // middle floors
    const randomGenerator = new RandomGenerator()
    randomGenerator.seed = 0

    for (let i = 1; i < floors; i++) {
      const variant = (building.variantsCount === 0) ? 0 : Math.floor(randomGenerator.rand() * building.variantsCount) + 1

      drawSegmentImage(spriteId, ctx,
        0,
        height - (building.mainFloorHeight * TILE_SIZE * TILESET_POINT_PER_PIXEL) - (building.floorHeight * TILE_SIZE * variant * TILESET_POINT_PER_PIXEL),
        // 168 - (building.floorHeight * TILE_SIZE * variant), // 0 - 240 + (120 * building.variantsCount) - (building.floorHeight * TILE_SIZE * variant),
        undefined,
        building.floorHeight * TILE_SIZE,
        offsetLeft + (leftPosShift * multiplier),
        offsetTop + (buildingHeight * multiplier) - ((building.mainFloorHeight + (building.floorHeight * i)) * TILE_SIZE * multiplier),
        undefined,
        building.floorHeight * TILE_SIZE,
        multiplier, dpi)
    }

    // roof
    drawSegmentImage(spriteId, ctx,
      0,
      0,
      undefined,
      building.roofHeight * TILE_SIZE,
      offsetLeft + (leftPosShift * multiplier),
      offsetTop + (buildingHeight * multiplier) - ((building.mainFloorHeight + (building.floorHeight * (floors - 1)) + building.roofHeight) * TILE_SIZE * multiplier),
      undefined,
      building.roofHeight * TILE_SIZE,
      multiplier, dpi)
  } else {
    // Single floor buildings
    // Determine how much tiling happens
    const count = Math.floor(totalWidth / width) + 2

    let currentX
    for (let i = 0; i < count; i++) {
      if ((i === 0) && (typeof firstX !== 'undefined')) {
        currentX = firstX
      } else if ((i === count - 1) && (typeof lastX !== 'undefined')) {
        currentX = lastX
      } else {
        currentX = x
      }

      drawSegmentImage(spriteId, ctx,
        currentX, undefined,
        width, undefined,
        offsetLeft + ((leftPosShift + (i * width)) * multiplier),
        offsetTop,
        width, undefined, multiplier, dpi)
    }
  }

  // If street width is exceeded, fade buildings
  // Note: it would make sense to also fade out buildings when drawing large canvases but that would
  // shade in the entire background erroneously
  if ((street.remainingWidth < 0) && (destination === BUILDING_DESTINATION_SCREEN)) {
    shadeInContext(ctx)
  }
}

/**
 * Fills the building rendered area with a color
 *
 * @param {CanvasRenderingContext2D} ctx
 */
function shadeInContext (ctx) {
  ctx.save()
  ctx.globalCompositeOperation = 'source-atop'
  // TODO const
  ctx.fillStyle = 'rgba(204, 163, 173, .9)'
  ctx.fillRect(0, 0, ctx.canvas.width, ctx.canvas.height)
  ctx.restore()
}

export function createBuilding (el, variant, position, floors, street) {
  const totalWidth = el.offsetWidth
  const buildingHeight = getBuildingImageHeight(variant, position, floors)

  const height = Math.min(MAX_CANVAS_HEIGHT, buildingHeight)
  const canvasEl = document.createElement('canvas')
  const oldCanvasEl = el.querySelector('canvas')
  const dpi = store.getState().system.devicePixelRatio

  canvasEl.width = totalWidth * dpi
  canvasEl.height = (height + GROUND_BASELINE_HEIGHT) * dpi
  canvasEl.style.width = totalWidth + 'px'
  canvasEl.style.height = height + GROUND_BASELINE_HEIGHT + 'px'

  // Replace previous canvas if present, otherwise append a new one
  if (oldCanvasEl) {
    el.replaceChild(canvasEl, oldCanvasEl)
  } else {
    el.appendChild(canvasEl)
  }

  const ctx = canvasEl.getContext('2d')
  drawBuilding(ctx, BUILDING_DESTINATION_SCREEN, street,
    position === 'left', totalWidth, height,
    0,
    1.0, dpi)
}
