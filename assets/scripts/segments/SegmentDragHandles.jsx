import React from 'react'
import PropTypes from 'prop-types'
import { connect } from 'react-redux'

export class SegmentDragHandles extends React.Component {
  static propTypes = {
    width: PropTypes.number,
    infoBubbleHovered: PropTypes.bool,
    descriptionVisible: PropTypes.bool
  }

  render () {
    const display = (this.props.infoBubbleHovered || this.props.descriptionVisible)
      ? 'none' : null

    // To prevent drag handles from overlapping each other when the segment widths are very small,
    // we calculate an X-position adjustment when the value of `width` is less than 60px.
    // The X position adjustment follows the linear equation y = 0.5x - 35 (where `x` is `width`).
    // For example, (`width = 36`, `adjustX = -11px`), (`width = 12`, `adjustX = -29px`).
    const adjustX = (this.props.width < 60)
      ? `${(0.5 * this.props.width) - 35}px` : null

    return (
      <React.Fragment>
        <span className="drag-handle drag-handle-left" style={{ display, left: adjustX }}>‹</span>
        <span className="drag-handle drag-handle-right" style={{ display, right: adjustX }}>›</span>
      </React.Fragment>
    )
  }
}

function mapStateToProps (state) {
  return {
    infoBubbleHovered: state.infoBubble.mouseInside,
    descriptionVisible: state.infoBubble.descriptionVisible
  }
}

export default connect(mapStateToProps)(SegmentDragHandles)
