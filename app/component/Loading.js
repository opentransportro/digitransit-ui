import React from 'react';
import PropTypes from 'prop-types';
import { FormattedMessage } from 'react-intl';

const defaultMessage = (
  <span className="sr-only">
    <FormattedMessage id="loading" defaultMessage="Loading" />
  </span>
);

const Loading = props => (
  <div className="spinner-bg">
    <div className="spinner-loader-bg">
      <div className="spinner-loader">
        {(props && props.children) || defaultMessage}
      </div>
    </div>
  </div>
);

Loading.displayName = 'Loading';
Loading.propTypes = {
  children: PropTypes.node,
};

export default Loading;
