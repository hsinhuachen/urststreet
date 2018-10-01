import React from 'react'
import PropTypes from 'prop-types'
import { connect } from 'react-redux'
import { DropTarget } from 'react-dnd'
import flow from 'lodash/flow'
import uuid from 'uuid'
import Segment from '../segments/Segment'
import { CSSTransition, TransitionGroup } from 'react-transition-group'
import { TILE_SIZE, DRAGGING_MOVE_HOLE_WIDTH } from '../segments/constants'
import { getVariantArray } from '../segments/variant_utils'
import { cancelSegmentResizeTransitions } from '../segments/resizing'
import {
  Types,
  canvasTarget,
  collectDropTarget,
  makeSpaceBetweenSegments,
  isSegmentWithinCanvas
} from '../segments/drag_and_drop'

class StreetEditable extends React.Component {
  static propTypes = {
    // Provided by parent
    onResized: PropTypes.bool.isRequired,
    setBuildingWidth: PropTypes.func.isRequired,
    updatePerspective: PropTypes.func.isRequired,

    // Provided by store
    street: PropTypes.object.isRequired,
    draggingState: PropTypes.object,

    // Provided by DropTarget
    connectDropTarget: PropTypes.func
  }

  constructor (props) {
    super(props)

    this.state = {
      suppressMouseEnter: false
    }
  }

  componentDidUpdate (prevProps) {
    const { onResized, draggingState } = this.props

    if (onResized && prevProps.onResized !== onResized) {
      this.props.setBuildingWidth(this.streetSectionEditable)
    }

    if (prevProps.street.id !== this.props.street.id || prevProps.street.width !== this.props.street.width) {
      cancelSegmentResizeTransitions()
    }

    const dragEvents = ['dragover', 'touchmove']
    if (!prevProps.draggingState && draggingState) {
      dragEvents.map((type) => { window.addEventListener(type, this.updateWithinCanvas) })
    } else if (prevProps.draggingState && !draggingState) {
      dragEvents.map((type) => { window.removeEventListener(type, this.updateWithinCanvas) })
    }
  }

  updateWithinCanvas = (event) => {
    const withinCanvas = isSegmentWithinCanvas(event, this.streetSectionEditable)
    if (withinCanvas) {
      document.body.classList.remove('not-within-canvas')
    } else {
      document.body.classList.add('not-within-canvas')
    }

    if (this.state.withinCanvas !== withinCanvas) {
      this.setState({ withinCanvas })
    }
  }

  updateSegmentData = (ref, dataNo, segmentPos) => {
    const { segments } = this.props.street
    const segment = segments[dataNo]

    if (segment) {
      segment.el = ref
      segment.el.dataNo = dataNo
      segment.el.savedLeft = Math.round(segmentPos)
      segment.el.cssTransformLeft = Math.round(segmentPos)
    }
  }

  switchSegmentAway = (el) => {
    el.classList.add('create')
    el.style.left = el.savedLeft + 'px'

    this.props.updatePerspective(el)
    this.setState({ suppressMouseEnter: true })
  }

  calculateSegmentPos = (dataNo) => {
    const { segments, remainingWidth } = this.props.street
    const { draggingState } = this.props

    let currPos = 0

    for (let i = 0; i < dataNo; i++) {
      const width = (draggingState && draggingState.draggedSegment === i) ? 0 : segments[i].width * TILE_SIZE
      currPos += width
    }

    let mainLeft = remainingWidth
    if (draggingState && segments[draggingState.draggedSegment] !== undefined) {
      const draggedWidth = segments[draggingState.draggedSegment].width || 0
      mainLeft += draggedWidth
    }

    mainLeft = (mainLeft * TILE_SIZE) / 2

    if (draggingState && this.state.withinCanvas) {
      mainLeft -= DRAGGING_MOVE_HOLE_WIDTH
      const spaceBetweenSegments = makeSpaceBetweenSegments(dataNo, draggingState)
      return Math.round(mainLeft + currPos + spaceBetweenSegments)
    } else {
      return Math.round(mainLeft + currPos)
    }
  }

  handleExitAnimations = (child) => {
    return React.cloneElement(child, {
      exit: !(this.props.street.immediateRemoval)
    })
  }

  renderStreetSegments = () => {
    const { segments, units, immediateRemoval } = this.props.street

    return segments.map((segment, i) => {
      const segmentPos = this.calculateSegmentPos(i)

      segment.variant = getVariantArray(segment.type, segment.variantString)
      segment.warnings = (segment.warnings) || []

      if (!segment.id) {
        segment.id = uuid()
      }

      const segmentEl = (
        <CSSTransition
          key={segment.id}
          timeout={250}
          classNames="switching-away"
          exit={!(immediateRemoval)}
          onExit={this.switchSegmentAway}
          onExited={() => { this.setState({ suppressMouseEnter: false }) }}
          unmountOnExit
        >
          <Segment
            key={segment.id}
            dataNo={i}
            segment={{...segment}}
            actualWidth={segment.width}
            units={units}
            segmentPos={segmentPos}
            suppressMouseEnter={this.state.suppressMouseEnter}
            updateSegmentData={this.updateSegmentData}
            updatePerspective={this.props.updatePerspective}
          />
        </CSSTransition>
      )

      return segmentEl
    })
  }

  render () {
    const { connectDropTarget } = this.props
    const style = {
      width: (this.props.street.width * TILE_SIZE) + 'px'
    }

    return connectDropTarget(
      <div
        id="street-section-editable"
        key={this.props.street.id}
        style={style}
        ref={(ref) => { this.streetSectionEditable = ref }}
      >
        <TransitionGroup key={this.props.street.id} component={null} enter={false} childFactory={this.handleExitAnimations}>
          {this.renderStreetSegments()}
        </TransitionGroup>
      </div>
    )
  }
}

function mapStateToProps (state) {
  return {
    street: state.street,
    draggingState: state.ui.draggingState
  }
}

export default flow(
  DropTarget([Types.SEGMENT, Types.PALETTE_SEGMENT], canvasTarget, collectDropTarget),
  connect(mapStateToProps)
)(StreetEditable)
