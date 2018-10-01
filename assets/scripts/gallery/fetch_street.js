import { showBlockingShield, hideBlockingShield } from '../app/blocking_shield'
import { API_URL } from '../app/config'
import { hideError, showError, ERRORS } from '../app/errors'
import {
  setLastStreet,
  trimStreetData,
  setIgnoreStreetChanges
} from '../streets/data_model'
import { updateStreetName } from '../streets/name'
import { unpackServerStreetData } from '../streets/xhr'
import { resizeStreetWidth } from '../streets/width'
import { getAuthHeader } from '../users/authentication'
import { segmentsChanged } from '../segments/view'
import store from '../store'

let lastRequestedStreetId = null

export function fetchGalleryStreet (streetId) {
  showBlockingShield()

  lastRequestedStreetId = streetId

  const url = API_URL + 'v1/streets/' + streetId
  const options = {
    headers: { 'Authorization': getAuthHeader() }
  }

  window.fetch(url, options)
    .then(function (response) {
      if (!response.ok) {
        throw response
      }
      return response.json()
    })
    .then(function (data) {
      hideBlockingShield()
      return data
    })
    .then(receiveGalleryStreet)
    .catch(errorReceiveGalleryStreet)
}

function errorReceiveGalleryStreet (err) {
  console.log(err)
  showError(ERRORS.GALLERY_STREET_FAILURE, false)
  // updateGallerySelection()
}

// TODO similar to receiveLastStreet
function receiveGalleryStreet (transmission) {
  // Reject stale transmissions
  if (transmission.id !== lastRequestedStreetId) {
    return
  }

  setIgnoreStreetChanges(true)

  hideError()
  unpackServerStreetData(transmission, null, null, true)

  // Some parts of the UI need to know this happened to respond to it
  window.dispatchEvent(new window.CustomEvent('stmx:receive_gallery_street'))

  resizeStreetWidth()
  updateStreetName(store.getState().street)
  segmentsChanged()

  setIgnoreStreetChanges(false)
  setLastStreet(trimStreetData(store.getState().street))
}
