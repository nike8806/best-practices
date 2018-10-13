import React, { Component } from 'react';
import PropTypes from 'prop-types';
import PlaidLink from './PlaidLink';

class PlaidGallery extends Component {
  static propTypes = {
    onBeforeOpen: PropTypes.func,
    plaidInstance: PropTypes.shape({
      open: PropTypes.func.isRequired
    }).isRequired,
    institutions: PropTypes.arrayOf(PropTypes.shape({
      institution: PropTypes.string.isRequired,
      ariaLabel: PropTypes.string.isRequired
    }))
  }

  static defaultProps = {
    onBeforeOpen: null,
    plaidInstance: null,
    institutions: [
      {
        institution: 'chase',
        ariaLabel: 'chase bank logo'
      }, {
        institution: 'wells',
        ariaLabel: 'wells fargo logo'
      }, {
        institution: 'bofa',
        ariaLabel: 'bank of america logo'
      }, {
        institution: 'pnc',
        ariaLabel: 'pnc bank logo'
      }, {
        institution: 'us',
        ariaLabel: 'us bank logo'
      }, {
        institution: 'usaa',
        ariaLabel: 'usaa logo'
      }
    ]
  }

  render() {
    const {
      onBeforeOpen,
      plaidInstance,
      institutions
    } = this.props;

    return (
      <React.Fragment>
        <div className="row-flush">
          { institutions.map(({institution, ariaLabel}) => (
            <div className="col-xs-6 col-sm-4" key={ institution }>
              <PlaidLink
                institution={ institution }
                className={`plaid-gallery__bank-logo plaid-gallery__bank-logo--${institution}`}
                role="img"
                aria-label={ ariaLabel }
                onBeforeOpen={ onBeforeOpen }
                plaidInstance={ plaidInstance }
              />
            </div>))
          }
        </div>

        <div className="plaid-gallery__find-bank margin-top-5 text-center">
          <PlaidLink
            onBeforeOpen={ onBeforeOpen }
            plaidInstance={ plaidInstance }
          >
            <div className="padding-all-10">
              <div className="h4">Find your bank</div>
              <div className="todo-text padding-bottom-0">
                Search 15,000+ banks.
                {' '}
                <span className="visible-sm-inline">Even local banks in your hometown.</span>
              </div>
            </div>
          </PlaidLink>
        </div>
      </React.Fragment>
    );
  }
}

export default PlaidGallery;
