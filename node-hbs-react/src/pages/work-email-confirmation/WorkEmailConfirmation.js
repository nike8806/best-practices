import React, { Component } from 'react';
import axios from 'lc-axios';
import { Loader, SuccessMessage, Modal, Input } from 'components';
import rules from 'ui-validator/src/common-rules';

const WORK_EMAIL_REGEX = /^[A-Za-z0-9._%+-]+@(?!(?:gmail|hotmail|yahoo|aol|comcast|msn))\w+[-\.\w]*?\.\w{2,4}$/;
const RESULT_SUCCESS_MESSAGES = {
  DO_NOT_WANT: {
    title: 'Thanks for your feedback. We will verify your employment with a different method',
    subtitle: 'Please be sure to finish the rest of your task list.'
  },
  DO_NOT_HAVE: {
    title: 'No problem. Thanks for letting us know',
    subtitle: 'Please be sure to finish the rest of your task list.'
  }
};

/**
 * Work email confirmation component
 *
 * Handle all interactions to verify the work email from borrower.
 */
class WorkEmailConfirmation extends Component {

  state = {
    optoutResult: '',
    showModal: '', //  Posible values: OPTOUT_NOT_WANT, EMAIL_SENT, ERROR
    showLoader: false,
    workEmail: '',
    errorWorkEmail: null,
    touchedWorkEmail: false
  };

  /**
   * Callback executed on InputWorkEmail. Make the AJAX request to send the email.
   *
   */
  handleSubmit = () => {
    const {
      workEmail,
      errorWorkEmail,
      touchedWorkEmail
    } = this.state;

    if (!touchedWorkEmail) {
      this.setState({
        touchedWorkEmail: true
      });
    }

    if (!workEmail || errorWorkEmail) {
      return;
    }

    this.setState({
      showLoader: true,
      optoutResult: '',
      showModal: '',
      formErrors: null
    });
    axios.post('/todo/work-email-confirmation/send', { email: workEmail })
      .then(response => {
        this.setState({
          showModal: 'EMAIL_SENT',
          showLoader: false
        });
      })
      .catch(error => {
        this.setState({
          showModal: 'ERROR',
          showLoader: false
        });
      });
  };

  /**
   * Handle the Optout -> Do not want give the email
   */
  handleOptoutDoNotWant = () => {
    this.submitOptOut('DO_NOT_WANT');
  }

  /**
   * Handle the Optout -> Do not have email
   */
  handleOptoutDoNotHave = () => {
    this.submitOptOut('DO_NOT_HAVE');
  }

  /**
  * Handler for display OptOut Modal of NOT_WANT option
  */
  handleShowModalDoNotWant = () => {
    this.setState({
      showModal: 'OPTOUT_NOT_WANT'
    });
  }

  /**
   * Manage AJAX request providing the opt-out option and displays a showError based on response
   *
   * @param {string} reason Reason to send in the ajax petition
   */
  submitOptOut = (reason) => {
    this.setState({
      showLoader: true,
      optoutResult: '',
      showModal: ''
    });

    axios.post('/todo/work-email-confirmation/optout', { reason })
      .then((response) => {
        this.setState({
          optoutResult: reason,
          showLoader: false
        });
      })
      .catch((error) => {
        this.setState({
          showModal: 'ERROR',
          showLoader: false
        });
      });
  };

  /**
   * Function to handle the modal dismiss
   */
  handleDismissModal = () => {
    this.setState({
      showModal: ''
    });
  };
  /**
   * Check if the workEmail is valid and return an error if is not
   * @param {String} workEmailValue
   * @return {String} error
   */
  validateWorkEmail = (workEmailValue) => {
    let error = (rules.required({message: 'Work email is required.'}, workEmailValue));
    if (error) return error;

    error = (rules.email({message: 'Please specify a valid email address'}, workEmailValue));
    if (error) return error;

    error = !WORK_EMAIL_REGEX.test(workEmailValue);
    if (error) {
        return `Sorry, we can\'t accept addresses from popular email providers
        (gmail, hotmail, yahoo, etc.). If you don\'t have any other work email address,
        please select \'I don\'t have a work email.\'`;
    }
  }

  /**
   * Handle the workEmail changes
   * @param {event} e
   */
  handleInputWorkemailChange = (e) => {
    const {value: workEmail} = e.target;
    const errorWorkEmail = this.validateWorkEmail(workEmail);

    this.setState({
      errorWorkEmail: errorWorkEmail,
      workEmail: workEmail
    });
  };

  /**
   * Handle if the work email was touched
   */
  handleWorkEmailInputTouched = (e) => {
    const {value: workEmail} = e.target;
    const errorWorkEmail = this.validateWorkEmail(workEmail);
    this.setState({
      errorWorkEmail: errorWorkEmail,
      touchedWorkEmail: true
    });
  }

  componentDidMount(prevProps, prevState) {
    const {workEmail} = this.state;
    const errorWorkEmail = this.validateWorkEmail(workEmail);
    this.setState({
      errorWorkEmail: errorWorkEmail
    });
  }

  componentDidUpdate(prevProps, prevState) {
    const { showModal: prevShowModal } = prevState;
    const { showModal } = this.state;

    if (prevShowModal === '' && showModal !== prevShowModal &&
      (showModal === 'ERROR' || showModal === 'EMAIL_SENT')) {
      this.timeOut = setTimeout(() => {
          this.setState({
            showModal: ''
          });
      }, 5000);
    }
  }

  /**
   * Render method
   *
   * @return {ReactElement}
   */
  render() {
    const { showLoader, optoutResult, showModal, errorWorkEmail, touchedWorkEmail, workEmail } = this.state;
    const {
      title: resultTitle,
      subtitle: resultSubtitle
    } = RESULT_SUCCESS_MESSAGES[optoutResult] || {};

    const emailErrorMessage = (touchedWorkEmail && errorWorkEmail) ? errorWorkEmail : null;

    return (
      <div className="work-email-confirmation">
        <div className="todo-body">
          {!optoutResult && (
            <div className="work-email-confirmation__email-section">
              <h1 className="todo-heading big">
                Quickly and easily verify your employment
              </h1>
              <p className="todo-text">
                The fastest way to verify your employment is to provide your work email.
                This email will only be used for verification purposes.
              </p>

              <label
                htmlFor="work-email-confirmation-input"
                className="sr-only"
              >
                Work email
              </label>

              <Input
                id="work-email-confirmation-input"
                type="email"
                placeholder="enter your work email"
                inputClassName="work-email-confirmation__work-email-input visible-inline"
                className="work-email-confirmation__work-email-control visible-inline"
                required
                errorMessage={emailErrorMessage}
                value={workEmail}
                onBlur={this.handleWorkEmailInputTouched}
                onChange={this.handleInputWorkemailChange}
              />

              <button
                type="button"
                className="btn btn-todo center-block work-email-confirmation__btn-submit-email margin-bottom-32 margin-top-32"
                onClick={ this.handleSubmit }
              >
                Submit
              </button>

              <h2 className="todo-heading">
                What happens next?
              </h2>

              <ol className="todo-text">
                <li>
                  We&apos;ll send you a one-time confirmation email (it might take a few seconds).
                </li>
                <li>
                  You click on the button in the email.
                </li>
                <li>
                  You&apos;re done!
                </li>
              </ol>

              <div className="row">
                <div className="col-xs-12 col-sm-6">
                  <button
                    type="button"
                    className="btn-todo-link work-email-confirmation__btn-show-opt-out-section visible-block margin-bottom-32"
                    onClick={this.handleShowModalDoNotWant}
                  >
                    I&apos;d rather not provide my work email
                  </button>
                </div>
                <div className="col-xs-12 col-sm-6 text-right-sm">
                  <button
                    type="button"
                    className="btn-todo-link work-email-confirmation__btn-optout-do-not-have"
                    onClick={this.handleOptoutDoNotHave}
                  >
                    I don&apos;t have a work email
                  </button>
                </div>
              </div>

            </div>
          )}

          {showModal === 'EMAIL_SENT' && (
            <Modal
              className="todo-modal work-email-confirmation__modal-email-sent"
              dialogClassName="work-email-confirmation__modal-dialog"
              onDismiss={this.handleDismissModal}
            >
              <h2 className="todo-heading text-center padding-all-0">
                Email sent! To complete verification click the link in the email you receive.
              </h2>
            </Modal>
          )}

          {showModal === 'OPTOUT_NOT_WANT' && (
            <Modal
              className="todo-modal work-email-confirmation__modal-not-want"
              dialogClassName="work-email-confirmation__modal-dialog"
              onDismiss={this.handleDismissModal}
              title="Just a heads up..."
              titleClassName="todo-heading"
            >
              <p className="todo-text">
                If you decide not to provide us with your work email, it may take us
                longer to verify your employment. We will use this email address
                to confirm your employment, but never for marketing purposes.
              </p>

              <button
                className="btn btn-todo center-block work-email-confirmation__btn-fast-way margin-bottom-32"
                onClick={this.handleDismissModal}
              >
                Go back to the faster way
              </button>

              <button
                className="btn-todo-link center-block work-email-confirmation__btn-optout-do-not-want"
                onClick={this.handleOptoutDoNotWant}
              >
                I understand, but I&apos;d prefer not to
              </button>
            </Modal>
          )}

          {showModal === 'ERROR' && (
            <Modal
              className="todo-modal work-email-confirmation__modal-error"
              dialogClassName="work-email-confirmation__modal-dialog"
              onDismiss={this.handleDismissModal}
            >
              <h2 className="todo-heading text-center padding-all-0">
                Something went wrong. Please try again later.
              </h2>
            </Modal>
          )}

          {optoutResult && (
            <SuccessMessage
              title={resultTitle}
              subtitle={resultSubtitle}
            >
              <a
                className="btn btn-todo"
                href="/account/myAccount.action"
              >
                Return to task list
              </a>
            </SuccessMessage>
          )}
        </div>
        {showLoader && (
          <Loader theme="fixed" />
        )}
      </div>
    );
  }
}

export default WorkEmailConfirmation;
