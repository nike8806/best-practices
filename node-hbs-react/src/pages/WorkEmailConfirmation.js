import React, { Component } from 'react';
import axios from 'lc-axios';
import { Notification, Loader } from 'components';
import { WorkEmail } from './components';

const RESULT_MESSAGES = {
  DO_NOT_WANT: {
    title: 'Thanks for your feedback, we will verify your employment with a different method.',
    subtitle: 'Please be sure to finish the rest of your to-do list.'
  },
  DO_NOT_HAVE: {
    title: 'No problem, thanks for letting us know.',
    subtitle: 'Please be sure to finish the rest of your to-do list.'
  },
  EMAIL_SENT: {
    title: 'Thank you for submitting your work email.',
    subtitle: 'Please check your email and confirm your email address.'
  }
};

const NOTIFICATION_ERROR_DEFAULT = {
  level: 'error',
  message: 'Something went wrong. Please try again later.'
};

/**
 * Work email confirmation component
 *
 * Handle all interactions to verify the work email from borrower.
 */
class WorkEmailConfirmation extends Component {
  state = {
    notification: null,
    resultMessage: null,
    // Possible values: workEmailSection. resultsSection, workEmailSection, optOutSection
    sectionToShow: 'workEmailSection',
    showLoader: false
  };

  /**
   * Callback executed on InputWorkEmail. Make the AJAX request to send the email.
   *
   * @param {String} email Email introduced by the user on InputWorkEmail
   */
  handleSubmit = (email) => {
    this.setState({ showLoader: true, notification: null });
    axios.post('/todo/work-email-confirmation/send', { email })
      .then(response => {
        this.setState({
          resultMessage: RESULT_MESSAGES.EMAIL_SENT,
          showLoader: false,
          sectionToShow: 'resultsSection'
        });
      })
      .catch(error => {
        this.setState({
          notification: NOTIFICATION_ERROR_DEFAULT,
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
   * Manage AJAX request providing the opt-out option and displays a notification based on response
   *
   * @param {string} reason Reason to send in the ajax petition
   */
  submitOptOut = (reason) => {
    const message = RESULT_MESSAGES[reason];
    this.setState({ showLoader: true, notification: null });

    axios.post('/todo/work-email-confirmation/optout', { reason })
      .then((response) => {
        this.setState({
          resultMessage: message,
          showLoader: false,
          sectionToShow: 'resultsSection'
        });
      })
      .catch((error) => {
        this.setState({
          notification: NOTIFICATION_ERROR_DEFAULT,
          showLoader: false
        });
      });
  };

  /**
  * Handler for display OptOut section
  */
  handleShowOptOut = () => {
    this.setState({
      sectionToShow: 'optOutSection'
    });
  }

  /**
  * Handler for display OptOut section
  */
  handleShowWorkEmail = () => {
    this.setState({
      sectionToShow: 'workEmailSection'
    });
  }

  /**
   * Render method
   *
   * @return {ReactElement}
   */
  render() {
    const { notification, sectionToShow, showLoader, resultMessage } = this.state;
    return (
      <div className="work-email-confirmation">
        {showLoader && (
          <Loader />
        )}

        {notification && (
          <Notification level={notification.level} message={notification.message} className="notification-box-plain" />
        )}
        <div className="todo is-open">
          <div className="todo-wrapper">
            <div className="todo-body work-email-confirmation__body">
              {sectionToShow === 'workEmailSection' && (
              <div className="work-email-confirmation__email-section">
                <h1 className="work-email-confirmation__title">
                  Quickly and easily verify your employment
                </h1>
                <p>
                  The fastest way to verify your employment is to provide your work email from LendingClub.
                  This email will only be used for verification purposes.
                </p>

                <WorkEmail onSubmit={this.handleSubmit} />

                <p>
                  <b>What happens next?</b>
                </p>

                <ol>
                  <li>We&apos;ll send you a one-time confirmation email (it might take a few seconds).</li>
                  <li>You click on the button in the email.</li>
                  <li>You&apos;re done!</li>
                </ol>

                <p>
                  <button className="button-link work-email-confirmation__btn-show-opt-out-section" onClick={this.handleShowOptOut}>
                    I&apos;d rather not provide my work email
                  </button>
                  <br/>
                </p>

                <p>
                  <button className="button-link work-email-confirmation__btn-optout-do-not-have" onClick={this.handleOptoutDoNotHave}>
                    I don&apos;t have a work email
                  </button>
                </p>
              </div>
              )}

              {sectionToShow === 'optOutSection' && (
                <div className="work-email-confirmation__optout-section ">
                  <h1 className="work-email-confirmation__title">
                    Just a heads up...
                  </h1>

                  <p>
                    If you decide not to provide us with your work email, it may take us
                    longer to verify your employment. We will use this email address
                    to confirm your employment, but never for marketing purposes.
                  </p>

                  <p>
                    <button className="btn btn--blue work-email-confirmation__btn-fast-way" onClick={this.handleShowWorkEmail}>
                      Go back to the faster way
                    </button>
                  </p>

                  <p>
                    <button className="button-link work-email-confirmation__btn-optout-do-not-want" onClick={this.handleOptoutDoNotWant}>
                      I understand, but I&apos;d prefer not to
                    </button>
                  </p>
                </div>
              )}

              { sectionToShow === 'resultsSection' && (
                <div className="work-email-confirmation__result-section text-center">
                    <h1 className="work-email-confirmation__title">
                      { resultMessage.title }
                    </h1>
                    <div data-container="success-logo" className="success-logo"></div>
                    <p>
                    { resultMessage.subtitle }
                    </p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    );
  }
}

export default WorkEmailConfirmation;
