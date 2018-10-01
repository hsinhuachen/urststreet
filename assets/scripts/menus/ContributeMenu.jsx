import React from 'react'
import { FormattedMessage } from 'react-intl'
import Menu from './Menu'
import Icon from '../ui/Icon'
import { trackEvent } from '../app/event_tracking'

export default class ContributeMenu extends React.PureComponent {
  onClickGitHub () {
    trackEvent('INTERACTION', '[Contribute menu] GitHub link clicked', null, null, false)
  }

  onClickDonate () {
    trackEvent('INTERACTION', '[Contribute menu] Donate link clicked', null, null, false)
  }

  onClickStickers () {
    trackEvent('INTERACTION', '[Contribute menu] Stickers link clicked', null, null, false)
  }

  render () {
    return (
      <Menu {...this.props}>
        <a href="https://github.com/streetmix/streetmix/" target="_blank" rel="noopener noreferrer" onClick={this.onClickGitHub}>
          <Icon icon="github" />
          <FormattedMessage id="menu.contribute.opensource" defaultMessage="Contribute to open source" />
        </a>
        <a href="https://opencollective.com/streetmix/" target="_blank" rel="noopener noreferrer" onClick={this.onClickDonate}>
          <FormattedMessage id="menu.contribute.donate" defaultMessage="Donate" />
        </a>
        {/* Sticker link is broken
        <a href="https://www.stickermule.com/user/1069909781/stickers" target="_blank" rel="noopener noreferrer" onClick={this.onClickStickers}>
          <FormattedMessage id="menu.contribute.stickers" defaultMessage="Buy a sticker sheet!" />
        </a> */}
      </Menu>
    )
  }
}
