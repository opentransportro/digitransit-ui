import PropTypes from 'prop-types';
import React from 'react';
import { intlShape, FormattedMessage } from 'react-intl';
import Icon from './Icon';
import ComponentUsageExample from './ComponentUsageExample';
import { isKeyboardSelectionEvent } from '../util/browser';

export default function RightOffcanvasToggle(
  { onToggleClick },
  { intl: { formatMessage } },
) {
  const label = formatMessage({
    id: 'settings-label-change',
    defaultMessage: 'Change settings',
  });
  return (
    <div className="right-offcanvas-toggle">
      <div
        role="button"
        tabIndex="0"
        onClick={onToggleClick}
        onKeyPress={e => isKeyboardSelectionEvent(e) && onToggleClick()}
        aria-label={label}
        title={label}
        className="noborder cursor-pointer"
      >
        <div>
          <div className="icon-holder">
            <Icon img="icon-icon_settings" />
          </div>
          <span className="settings-button-text">
            <FormattedMessage id="settings" defaultMessage="Settings" />
          </span>
        </div>
      </div>
    </div>
  );
}

RightOffcanvasToggle.propTypes = {
  onToggleClick: PropTypes.func.isRequired,
};

RightOffcanvasToggle.contextTypes = {
  intl: intlShape.isRequired,
};

RightOffcanvasToggle.displayName = 'RightOffcanvasToggle';

RightOffcanvasToggle.description = () => (
  <div>
    <p>A toggle for the itinerary search preferences.</p>
    <ComponentUsageExample>
      <RightOffcanvasToggle onToggleClick={() => {}} />
    </ComponentUsageExample>
  </div>
);
