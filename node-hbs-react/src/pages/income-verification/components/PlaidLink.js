import React, { Component } from 'react';
import PropTypes from 'prop-types';

class PlaidLink extends Component {
  static defaultProps = {
    institution: null,
    onBeforeOpen: null,
    plaidInstance: null,
    className: null
  };

  static propTypes = {
    institution: PropTypes.string,
    onBeforeOpen: PropTypes.func,
    plaidInstance: PropTypes.shape({
      open: PropTypes.func.isRequired
    }),
    children: PropTypes.node,
    className: PropTypes.string
  }

  handleClick = () => {
    const {
      onBeforeOpen,
      institution,
      plaidInstance
    } = this.props;

    if (onBeforeOpen) {
      onBeforeOpen({institution});
    }

    if (plaidInstance) {
      plaidInstance.open(institution);
    }
  }

  render() {
    const {
      children,
      onBeforeOpen, // eslint-disable-line no-unused-vars
      plaidInstance, // eslint-disable-line no-unused-vars
      institution, // eslint-disable-line no-unused-vars
      className,
      ...linkAttributes
    } = this.props;

    return (
      <a
        {...linkAttributes}
        onClick={ this.handleClick }
        className={ className }
      >
        { children }
      </a>
    );
  }
}

export default PlaidLink;
