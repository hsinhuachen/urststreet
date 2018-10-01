import {
  REPLACE_STREET_DATA,
  ADD_SEGMENT,
  REMOVE_SEGMENT,
  MOVE_SEGMENT,
  UPDATE_SEGMENTS,
  CHANGE_SEGMENT_WIDTH,
  CHANGE_SEGMENT_VARIANT,
  ADD_LOCATION,
  CLEAR_LOCATION,
  SAVE_STREET_NAME,
  SAVE_CREATOR_ID,
  SAVE_STREET_ID,
  SET_UPDATE_TIME,
  SAVE_ORIGINAL_STREET_ID,
  UPDATE_EDIT_COUNT,
  SET_UNITS,
  UPDATE_STREET_WIDTH,
  UPDATE_SCHEMA_VERSION,
  // BUILDINGS
  ADD_BUILDING_FLOOR,
  REMOVE_BUILDING_FLOOR,
  SET_BUILDING_FLOOR_VALUE,
  SET_BUILDING_VARIANT
} from './'

export function updateStreetData (street) {
  return {
    type: REPLACE_STREET_DATA,
    street
  }
}

export function addSegment (index, segment) {
  return {
    type: ADD_SEGMENT,
    index,
    segment
  }
}

export function removeSegment (index, immediate = true) {
  return {
    type: REMOVE_SEGMENT,
    index,
    immediate
  }
}

export function moveSegment (index, newIndex) {
  return {
    type: MOVE_SEGMENT,
    index,
    newIndex
  }
}

export function updateSegments (segments, occupiedWidth, remainingWidth) {
  return {
    type: UPDATE_SEGMENTS,
    segments,
    occupiedWidth,
    remainingWidth
  }
}

export function clearSegments () {
  return {
    type: UPDATE_SEGMENTS,
    segments: [],
    immediate: true
  }
}

export function changeSegmentWidth (index, width) {
  return {
    type: CHANGE_SEGMENT_WIDTH,
    index,
    width
  }
}

export function changeSegmentVariant (index, set, selection) {
  return {
    type: CHANGE_SEGMENT_VARIANT,
    index,
    set,
    selection
  }
}

export function saveStreetName (streetName, userUpdated, system = false) {
  return {
    type: SAVE_STREET_NAME,
    streetName,
    userUpdated,
    system
  }
}

export function saveCreatorId (creatorId) {
  return {
    type: SAVE_CREATOR_ID,
    creatorId
  }
}

export function saveStreetId (id, namespacedId) {
  return {
    type: SAVE_STREET_ID,
    id,
    namespacedId
  }
}

// TODO: validate time is a string matching ISO string format
export function setUpdateTime (time) {
  return {
    type: SET_UPDATE_TIME,
    time
  }
}

export function saveOriginalStreetId (id) {
  return {
    type: SAVE_ORIGINAL_STREET_ID,
    id
  }
}

export function updateEditCount (count) {
  return {
    type: UPDATE_EDIT_COUNT,
    count
  }
}

export function setUnits (units) {
  return {
    type: SET_UNITS,
    units
  }
}

export function updateStreetWidth (width) {
  return {
    type: UPDATE_STREET_WIDTH,
    width
  }
}

export function updateSchemaVersion (version) {
  return {
    type: UPDATE_SCHEMA_VERSION,
    version
  }
}

export function addLocation (location) {
  return {
    type: ADD_LOCATION,
    location
  }
}

export function clearLocation () {
  return {
    type: CLEAR_LOCATION,
    defaultName: null
  }
}

// Buildings

/**
 * Adds one more building floor
 *
 * @param {string} position - must be 'left' or 'right
 */
export function addBuildingFloor (position) {
  return {
    type: ADD_BUILDING_FLOOR,
    position
  }
}

/**
 * Removes one building floor
 *
 * @param {string} position - must be 'left' or 'right
 */
export function removeBuildingFloor (position) {
  return {
    type: REMOVE_BUILDING_FLOOR,
    position
  }
}

/**
 * Sets building floor to specific value
 *
 * @param {string} position - must be 'left' or 'right
 * @param {Number} value - the value to set it to
 */
export function setBuildingFloorValue (position, value) {
  return {
    type: SET_BUILDING_FLOOR_VALUE,
    position,
    value
  }
}

/**
 * Sets building to a selected variant
 *
 * @param {string} position - must be 'left' or 'right
 * @param {string} variant - the variant to set it to
 */
export function setBuildingVariant (position, variant) {
  return {
    type: SET_BUILDING_VARIANT,
    position,
    variant
  }
}
