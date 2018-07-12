import React, { Component } from 'react';
import PropTypes from 'prop-types';


class WorkEmail extends Component {
  static propTypes = {
    onSubmit: PropTypes.func.isRequired
  };

  state = {
    email: null,
    validated: false,
    isValid: false,
    emailErrorMessage: null
  };

  /**
   * Sync state with the user input
   *
   * @param {SyntheticEvent}
   */
  handleInput = (event) => {
    const email = event.target.value;

    this.setState(() => ({
      email,
      isValid: this._isValid(email)
    }));
  }

  /**
   * Catch the attempt to submit
   *
   * @param {SyntheticEvent}
   */
  handleSubmit = (event) => {
    this.setState(() => ({
      validated: true,
      isValid: this._isValid(this.state.email)
    }));

    if (this._isValid(this.state.email)) {
      this.props.onSubmit(this.state.email);
    }
  }

  /**
   * Validate if the email is not from a public service. It's the condition to validate as a work email.
   *
   * @param {string} Work email to validate
   * @return {boolean}
   */
  _isValid(email) {
    let condition = new RegExp('^[A-Za-z0-9._%+-]+@(?:[A-Za-z0-9-]+\\.)+[A-Za-z]{2,4}$');

    // Check if is valid email
    if (!condition.test(email)) {
      this.setState({
        emailErrorMessage: 'Please specify a valid email address'
      });
      return false;
    }

    // Invalidate email as work email for listed domains. See ticket UWOPS-141 for details
    condition = /^[A-Za-z0-9._%+-]+@(?!(?:gmail|hotmail|yahoo|aol|comcast|msn))\w+[-\.\w]*?\.\w{2,4}$/;
    if (!condition.test(email)) {
      this.setState({
        emailErrorMessage: 'Sorry, we can\'t accept addresses from popular email providers (gmail, hotmail, yahoo, etc.). If you don\'t have any other work email address, please select \'I don\'t have a work email.\''
      });
      return false;
    }
    this.setState({
      emailErrorMessage: null
    });

    return true;
  }

  /**
   * Render method
   *
   * @return {ReactElement}
   */
  render() {
    const errorClass = (this.state.validated && !this.state.isValid) ? 'has-error' : '';
    const emailErrorMessage = this.state.emailErrorMessage;

    return (
      <div className={ errorClass }>
        <input type="email" className="form-control" onChange={ this.handleInput } />
        { !errorClass ? null :
          <div className="error-message">
            <span className="icon icon-form-error error-image"></span>
            <span className="error-text">{emailErrorMessage}</span>
          </div>
        }
        <button type="submit" className="btn btn--blue work-email-confirmation__btn-submit-email" onClick={ this.handleSubmit }>
          Submit
        </button>
      </div>
    );
  }
}

export default WorkEmail;
