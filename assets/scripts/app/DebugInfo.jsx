/**
 * DebugInfo.jsx
 *
 * Displays a debugging overlay that shows the current state of the application.
 *
 * @module DebugInfo
 * @requires keypress
 */
import React from 'react'
import PropTypes from 'prop-types'
import { connect } from 'react-redux'
import { cloneDeep } from 'lodash'
import { registerKeypress, deregisterKeypress } from './keypress'
import { loseAnyFocus } from '../util/focus'

class DebugInfo extends React.Component {
  static propTypes = {
    settings: PropTypes.object.isRequired,
    street: PropTypes.object.isRequired,
    flags: PropTypes.object.isRequired,
    undo: PropTypes.object.isRequired
  }

  constructor (props) {
    super(props)

    this.state = {
      visible: false,
      content: ''
    }
  }

  componentDidMount () {
    // Register keyboard input for show (shift-D)
    registerKeypress('shift d', this.showDebugInfo)
  }

  getTextareaContent = () => {
    const debugStreetData = cloneDeep(this.props.street)
    const debugUndo = cloneDeep(this.props.undo)

    // Some things just shouldn't be seen...
    for (let i in debugStreetData.segments) {
      delete debugStreetData.segments[i].el
    }

    for (let j in debugUndo) {
      for (let k in debugUndo[j].segments) {
        delete debugUndo[j].segments[k].el
      }
    }

    // Create a JSON object, this parses better in editors
    const debugObj = {
      'DATA': debugStreetData,
      'SETTINGS': this.props.settings,
      'FLAGS': this.props.flags,
      'UNDO': debugUndo
    }

    return JSON.stringify(debugObj, null, 2)
  }

  showDebugInfo = () => {
    this.setState({
      visible: true,
      content: this.getTextareaContent()
    })

    this.textareaEl.focus()
    this.textareaEl.select()

    // Prevent scrolling to bottom of textarea after select
    window.setTimeout(() => {
      this.textareaEl.scrollTop = 0
    }, 0)

    // Set up keypress listener to close debug window
    registerKeypress('esc', this.hideDebugInfo)
    // TODO: Register mouse inputs for hide
  }

  hideDebugInfo = () => {
    this.setState({
      visible: false,
      content: ''
    })

    loseAnyFocus()

    // Remove keypress listener
    deregisterKeypress('esc', this.hideDebugInfo)
  }

  render () {
    let className = 'debug-info'

    if (this.state.visible === true) {
      className += ' visible'
    }

    return (
      <div className={className} ref={(ref) => { this.containerEl = ref }}>
        <textarea value={this.state.content} readOnly ref={(ref) => { this.textareaEl = ref }} />
      </div>
    )
  }
}

function mapStateToProps (state) {
  return {
    settings: state.settings,
    street: state.street,
    flags: state.flags,
    undo: state.undo
  }
}

export default connect(mapStateToProps)(DebugInfo)
