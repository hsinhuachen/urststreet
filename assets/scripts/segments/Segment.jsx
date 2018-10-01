import React from 'react'
import PropTypes from 'prop-types'
import { connect } from 'react-redux'
import { DragSource, DropTarget } from 'react-dnd'
import { getEmptyImage } from 'react-dnd-html5-backend'
import flow from 'lodash/flow'
import { CSSTransition } from 'react-transition-group'

import SegmentCanvas from './SegmentCanvas'
import SegmentDragHandles from './SegmentDragHandles'
import MeasurementText from '../ui/MeasurementText'

import {
  TILE_SIZE,
  SEGMENT_WARNING_OUTSIDE,
  SEGMENT_WARNING_WIDTH_TOO_SMALL,
  SEGMENT_WARNING_WIDTH_TOO_LARGE
} from './constants'
import {
  Types,
  segmentSource,
  collectDragSource,
  segmentTarget,
  collectDropTarget
} from './drag_and_drop'
import { getSegmentVariantInfo, getSegmentInfo } from './info'
import { normalizeSegmentWidth, RESIZE_TYPE_INITIAL, suppressMouseEnter, incrementSegmentWidth } from './resizing'
import { removeSegment, removeAllSegments } from './remove'
import { SETTINGS_UNITS_METRIC } from '../users/constants'
import { infoBubble } from '../info_bubble/info_bubble'
import { INFO_BUBBLE_TYPE_SEGMENT } from '../info_bubble/constants'
import { KEYS } from '../app/keyboard_commands'
import { trackEvent } from '../app/event_tracking'
import { t } from '../locales/locale'
import { setActiveSegment } from '../store/actions/ui'

class Segment extends React.Component {
  static propTypes = {
    // Provided by parent
    dataNo: PropTypes.number,
    segment: PropTypes.object.isRequired,
    actualWidth: PropTypes.number.isRequired,
    units: PropTypes.number,
    segmentPos: PropTypes.number,
    suppressMouseEnter: PropTypes.bool.isRequired,
    updateSegmentData: PropTypes.func,
    updatePerspective: PropTypes.func,

    // Provided by store
    cssTransform: PropTypes.string,
    locale: PropTypes.string,
    infoBubbleHovered: PropTypes.bool,
    descriptionVisible: PropTypes.bool,
    activeSegment: PropTypes.number,
    setActiveSegment: PropTypes.func,

    // Provided by react-dnd DragSource and DropTarget
    connectDragSource: PropTypes.func,
    connectDragPreview: PropTypes.func,
    connectDropTarget: PropTypes.func,
    isDragging: PropTypes.bool
  }

  static defaultProps = {
    units: SETTINGS_UNITS_METRIC,
    suppressMouseEnter: false
  }

  constructor (props) {
    super(props)

    this.oldSegmentCanvas = React.createRef()
    this.newSegmentCanvas = React.createRef()
    this.initialRender = true

    this.state = {
      switchSegments: false,
      oldVariant: props.segment.variantString
    }
  }

  componentDidMount = () => {
    this.props.updateSegmentData(this.streetSegment, this.props.dataNo, this.props.segmentPos)

    this.props.connectDragPreview(getEmptyImage(), { captureDraggingState: true })
  }

  componentDidUpdate (prevProps, prevState) {
    // During a segment removal or a dragging action, the infoBubble temporarily does not appear
    // for the hovered/dragged segment. Once the removal or drag action ends, the infoBubble for
    // the active segment should be shown. The following IF statement checks to see if a removal
    // or drag action occurred previously to this segment and displays the infoBubble for the
    // segment if it is equal to the activeSegment and no infoBubble was shown already.
    const wasDragging = (prevProps.isDragging && !this.props.isDragging) ||
      (this.initialRender && (this.props.activeSegment || this.props.activeSegment === 0))
    const mouseEnterSuppressed = (prevProps.suppressMouseEnter && !this.props.suppressMouseEnter)
    this.initialRender = false

    if ((wasDragging || mouseEnterSuppressed) && this.props.activeSegment === this.props.dataNo) {
      infoBubble.considerShowing(false, this.streetSegment, INFO_BUBBLE_TYPE_SEGMENT)
    }

    if (prevProps.segment.variantString && prevProps.segment.variantString !== this.props.segment.variantString) {
      this.switchSegments(prevProps.segment.variantString)
    }

    if (!prevState.switchSegments && this.state.switchSegments) {
      this.props.updatePerspective(this.oldSegmentCanvas.firstChildElement)
      this.props.updatePerspective(this.newSegmentCanvas.firstChildElement)
    }

    this.props.updateSegmentData(this.streetSegment, this.props.dataNo, this.props.segmentPos)
  }

  componentWillUnmount = () => {
    window.removeEventListener('keydown', this.handleKeyDown)
  }

  switchSegments = (oldVariant) => {
    this.setState({
      switchSegments: !(this.state.switchSegments),
      oldVariant: (this.state.switchSegments) ? this.props.segment.variantString : oldVariant
    })
  }

  calculateSegmentWidths = (resizeType) => {
    let actualWidth = this.props.actualWidth

    actualWidth = normalizeSegmentWidth(actualWidth, resizeType)

    return actualWidth
  }

  onSegmentMouseEnter = (event) => {
    if (this.props.suppressMouseEnter || suppressMouseEnter()) {
      this.props.setActiveSegment(this.props.dataNo)
      return
    }

    window.addEventListener('keydown', this.handleKeyDown)
    infoBubble.considerShowing(event, this.streetSegment, INFO_BUBBLE_TYPE_SEGMENT)
  }

  onSegmentMouseLeave = () => {
    window.removeEventListener('keydown', this.handleKeyDown)
    infoBubble.dontConsiderShowing()
  }

  renderSegmentCanvas = (variantType) => {
    const isOldVariant = (variantType === 'old')
    const { segment, connectDragSource, connectDropTarget } = this.props

    return connectDragSource(connectDropTarget(
      <div className="segment-canvas-container">
        <SegmentCanvas
          actualWidth={this.props.actualWidth}
          type={segment.type}
          variantString={(isOldVariant) ? this.state.oldVariant : segment.variantString}
          randSeed={segment.randSeed}
          ref={(isOldVariant) ? this.oldSegmentCanvas : this.newSegmentCanvas}
        />
      </div>
    ))
  }

  /**
   * Decreases segment width
   *
   * @param {Number} position - segment position
   * @param {Boolean} finetune - true if shift key is pressed
   */
  decrementSegmentWidth (position, finetune) {
    const actualWidth = this.calculateSegmentWidths(RESIZE_TYPE_INITIAL)
    incrementSegmentWidth(position, false, finetune, actualWidth)
  }

  /**
   * Increases segment width
   *
   * @param {Number} position - segment position
   * @param {Boolean} finetune - true if shift key is pressed
   */
  incrementSegmentWidth (position, finetune) {
    const actualWidth = this.calculateSegmentWidths(RESIZE_TYPE_INITIAL)
    incrementSegmentWidth(position, true, finetune, actualWidth)
  }

  handleKeyDown = (event) => {
    switch (event.keyCode) {
      case KEYS.MINUS:
      case KEYS.MINUS_ALT:
      case KEYS.MINUS_KEYPAD:
        if (event.metaKey || event.ctrlKey || event.altKey) return

        event.preventDefault()
        this.decrementSegmentWidth(this.props.dataNo, event.shiftKey)
        trackEvent('INTERACTION', 'CHANGE_WIDTH', 'KEYBOARD', null, true)
        break
      case KEYS.EQUAL:
      case KEYS.EQUAL_ALT:
      case KEYS.PLUS_KEYPAD:
        if (event.metaKey || event.ctrlKey || event.altKey) return

        event.preventDefault()
        this.incrementSegmentWidth(this.props.dataNo, event.shiftKey)
        trackEvent('INTERACTION', 'CHANGE_WIDTH', 'KEYBOARD', null, true)
        break
      case KEYS.BACKSPACE:
      case KEYS.DELETE:
        // Prevent deletion from occurring if the description is visible
        if (this.props.descriptionVisible) return

        // If the shift key is pressed, we remove all segments
        if (event.shiftKey === true) {
          removeAllSegments()
          trackEvent('INTERACTION', 'REMOVE_ALL_SEGMENTS', 'KEYBOARD', null, true)
        } else {
          removeSegment(this.props.dataNo)
          trackEvent('INTERACTION', 'REMOVE_SEGMENT', 'KEYBOARD', null, true)
        }
        break
      default:
        break
    }
  }

  render () {
    const { segment } = this.props

    const segmentInfo = getSegmentInfo(segment.type)
    const variantInfo = getSegmentVariantInfo(segment.type, segment.variantString)
    const defaultName = variantInfo.name || segmentInfo.name // the name to display if there isn't a localized version of it
    const nameKey = variantInfo.nameKey || segmentInfo.nameKey

    // Get localized names from store, fall back to segment default names if translated
    // text is not found. TODO: port to react-intl/formatMessage later.
    const displayName = t(`segments.${nameKey}`, defaultName, { ns: 'segment-info' })

    const actualWidth = this.calculateSegmentWidths(RESIZE_TYPE_INITIAL)
    const elementWidth = actualWidth * TILE_SIZE

    const segmentStyle = {
      width: elementWidth + 'px',
      // In a street, certain segments have stacking priority over others (expressed as z-index).
      // Setting a z-index here will clobber a separate z-index (applied via CSS) when hovered by mouse pointer
      zIndex: (this.props.isDragging) ? 0 : segmentInfo.zIndex,
      [this.props.cssTransform]: 'translateX(' + this.props.segmentPos + 'px)'
    }

    const dataAttributes = {
      'data-width': actualWidth
    }

    const classNames = ['segment']

    if (this.props.isDragging) {
      classNames.push('dragged-out')
    } else if (this.props.activeSegment === this.props.dataNo) {
      classNames.push('hover', 'show-drag-handles')
    }

    // Palette segments don't have `segment` defined
    if (segment && segment.warnings) {
      if (segment.warnings[SEGMENT_WARNING_OUTSIDE] || segment.warnings[SEGMENT_WARNING_WIDTH_TOO_SMALL] || segment.warnings[SEGMENT_WARNING_WIDTH_TOO_LARGE]) {
        classNames.push('warning')
      }
      if (segment.warnings[SEGMENT_WARNING_OUTSIDE]) {
        classNames.push('outside')
      }
    }

    return (
      <div
        style={segmentStyle}
        className={classNames.join(' ')}
        {...dataAttributes}
        ref={(ref) => { this.streetSegment = ref }}
        onMouseEnter={this.onSegmentMouseEnter}
        onMouseLeave={this.onSegmentMouseLeave}
      >
        <span className="name">
          {displayName}
        </span>
        <span className="width">
          <MeasurementText value={actualWidth} units={this.props.units} locale={this.props.locale} />
        </span>
        <span className={'grid' + (this.props.units === SETTINGS_UNITS_METRIC ? ' units-metric' : ' units-imperial')} />
        <SegmentDragHandles width={elementWidth} />
        <CSSTransition
          key="old-variant"
          in={!this.state.switchSegments}
          classNames="switching-away"
          timeout={250}
          onExited={this.switchSegments}
          unmountOnExit
        >
          {this.renderSegmentCanvas('old')}
        </CSSTransition>
        <CSSTransition
          key="new-variant"
          in={this.state.switchSegments}
          classNames="switching-in"
          timeout={250}
          unmountOnExit
        >
          {this.renderSegmentCanvas('new')}
        </CSSTransition>
        <div className="hover-bk" />
      </div>
    )
  }
}

function mapStateToProps (state) {
  return {
    cssTransform: state.system.cssTransform,
    locale: state.locale.locale,
    infoBubbleHovered: state.infoBubble.mouseInside,
    descriptionVisible: state.infoBubble.descriptionVisible,
    activeSegment: (typeof state.ui.activeSegment === 'number') ? state.ui.activeSegment : null
  }
}

function mapDispatchToProps (dispatch) {
  return {
    setActiveSegment: (position) => { dispatch(setActiveSegment(position)) }
  }
}

export default flow(
  DragSource(Types.SEGMENT, segmentSource, collectDragSource),
  DropTarget([Types.SEGMENT, Types.PALETTE_SEGMENT], segmentTarget, collectDropTarget),
  connect(mapStateToProps, mapDispatchToProps)
)(Segment)
