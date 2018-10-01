import { infoBubble } from '../info_bubble/info_bubble'
import { app } from '../preinit/app_settings'
import store from '../store'
import { windowResize } from '../store/actions/system'

let streetSectionTop

export function getStreetSectionTop () {
  return streetSectionTop
}

export function onResize () {
  store.dispatch(windowResize(window.innerWidth, window.innerHeight))
  const viewportHeight = window.innerHeight

  const streetSectionHeight = document.querySelector('#street-section-inner').offsetHeight
  const paletteTop = document.querySelector('.palette-container').offsetTop || viewportHeight

  // TODO const
  if (viewportHeight - streetSectionHeight > 450) {
    streetSectionTop = ((viewportHeight - streetSectionHeight - 450) / 2) + 450 + 80
  } else {
    streetSectionTop = viewportHeight - streetSectionHeight + 70
  }

  if (app.readOnly) {
    streetSectionTop += 80
  }

  // TODO const
  if (streetSectionTop + document.querySelector('#street-section-inner').offsetHeight > paletteTop - 20 + 180) { // gallery height
    streetSectionTop = paletteTop - 20 - streetSectionHeight + 180
  }

  const streetSectionDirtPos = viewportHeight - streetSectionTop - 400 + 180

  document.querySelector('#street-section-dirt').style.height = streetSectionDirtPos + 'px'

  infoBubble.show(true)
}
