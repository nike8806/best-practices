import React, { Component } from 'react';
import PropTypes from 'prop-types';
import axios from 'lc-axios';
import {
  Modal, Loader, SuccessMessage, Timeout
} from 'components';
import heapTrack from 'heap-track/heap-track';
import PlaidGallery from './components/PlaidGallery';

const heapTrackIV = heapTrack.bind(null, 'TDL Income Verification');

/**
 * Handles all interactions with Income Verification item.
 */
class IncomeVerification extends Component {
  static propTypes = {
    plaidAlreadyLinked: PropTypes.bool,
    plaidInstitutionName: PropTypes.string,
    plaidAgreementType: PropTypes.string,
    plaidAgreementVersion: PropTypes.number,
    plaidConfig: PropTypes.shape({
      clientName: PropTypes.string.isRequired,
      product: PropTypes.arrayOf(PropTypes.string).isRequired,
      selectAccount: PropTypes.bool.isRequired,
      env: PropTypes.string.isRequired,
      key: PropTypes.string.isRequired
    }).isRequired,
    plaidClient: PropTypes.shape({
      create: PropTypes.func
    }).isRequired,
    plaidInstitutionLogo: PropTypes.string
  }

  static defaultProps = {
    plaidAlreadyLinked: false,
    plaidInstitutionName: null,
    plaidAgreementType: null,
    plaidAgreementVersion: null,
    plaidInstitutionLogo: null
  };

  state = {
    showLoader: false,
    showOptoutModal: false,
    showOptoutSuccess: false,
    showPlaidSuccess: false,
    // showSection possible values: bankGallery, step1, step2
    showSection: this.props.plaidAlreadyLinked ? 'step1' : 'bankGallery',
    serverErrorMessage: ''
  }

  constructor(props) {
    super(props);
    this.createPlaidClient();

    // Tracking if a bank is already linked
    const { plaidAlreadyLinked, plaidInstitutionName } = props;
    if (plaidAlreadyLinked) {
      heapTrackIV({
        TYPE: 'Plaid Linked',
        BANK_NAME: plaidInstitutionName
      });
    } else {
      heapTrackIV({
        TYPE: 'Plaid Not Linked'
      });
    }
  }

  /**
   * Transitions to step 2 validating current plaid config
   */
  handleNextStep = () => {
    this.setState({
      showLoader: true
    }, () => {
      this.timeOut = setTimeout(() => {
        this.setState({
          showLoader: false,
          showSection: 'step2'
        });
      }, 3000);
    });

    heapTrackIV({
      TYPE: 'Click Use Existing Plaid Account Button'
    });
  }

  /**
   * Displays bank gallery view
   */
  handleBankGallery = () => {
    this.setState({
      showSection: 'bankGallery'
    });

    heapTrackIV({
      TYPE: 'Click go to Main Plaid Flow'
    });
  }

  /**
   * Shows/hides modal for optout interaction
   */
  handleToggleOptout = () => {
    const { showOptoutModal: showOptoutModalCurrent } = this.state;
    heapTrackIV({
      TYPE: (showOptoutModalCurrent) ? 'Click Go Back Button' : 'Click Optout Confirmation Button'
    });

    this.setState(({ showOptoutModal }) => ({
      showOptoutModal: !showOptoutModal
    }));
  }

  /**
   * Hides error message modal by clearing the error message
   */
  handleHideErrorModal = () => {
    this.setState({
      serverErrorMessage: null
    });
  }

  /**
   * Event handler for optout service call.
   * When successful, shows a Success Message.
   * Otherwise, displays an error modal.
   */
  handleSubmitOptout = () => {
    this.setState({
      showLoader: true,
      showOptoutModal: false
    });

    axios.post('/todo/income-verification/optout')
      .then(() => {
        this.setState({
          showLoader: false,
          showOptoutSuccess: true,
          showSection: ''
        });

        heapTrackIV({
          TYPE: 'Optout Submission',
          STATUS: 'success'
        });
      })
      .catch(() => {
        this.setState({
          showLoader: false,
          serverErrorMessage: 'We have a problem. Please try again.',
          showOptoutSuccess: false
        });

        heapTrackIV({
          TYPE: 'Optout Submission',
          STATUS: 'error'
        });
      });
  }

  /**
   * Triggers the optin once plaid interaction has finished
   */
  handlePlaidSuccess = (publicToken, data) => {
    const {
      plaidAgreementType,
      plaidAgreementVersion
    } = this.props;

    const { name: institution } = data.institution;

    this.setState({
      showLoader: true,
      serverErrorMessage: null
    });

    axios.post('/todo/income-verification/optin', {
      ...data,
      plaidAgreementType,
      plaidAgreementVersion
    }).then(() => {
      this.setState({
        showLoader: false,
        showPlaidSuccess: true,
        showSection: ''
      });

      heapTrackIV({
        TYPE: 'Optin Submission',
        BANK_NAME: institution,
        STATUS: 'success'
      });
    }).catch(() => {
      this.setState({
        showLoader: false,
        serverErrorMessage: 'Looks like we had trouble connecting to your bank. Let\'s try that again.',
        showPlaidSuccess: false
      });

      heapTrackIV({
        TYPE: 'Optin Submission',
        BANK_NAME: institution,
        STATUS: 'error'
      });
    });
  }

  /**
   * handlePlaidEvent
   * Handle when an event plaid is executed
   * Reference: https://plaid.com/docs/#onevent-callback
   * @param {String} eventName Represent the event that has just occurred in the Link flow.
   * @param {Object} metadata An object containing information about the event.
   */
  handlePlaidEvent = (eventName, metadata) => {
    const trackingMetaData = {
      ACTION: 'plaid-link-event',
      EVENT_NAME: eventName,
      CONSUMER: 'borrower'
    };

    Object.entries(metadata).forEach(([key, value]) => {
      trackingMetaData[`METADATA_${key}`] = value;
    });

    heapTrackIV(trackingMetaData);
  }

  /**
   * handlePlaidExitfunction
   * Handle when an event plaid is executed
   * Reference: https://plaid.com/docs/#onexit-callback
   * @param {Object} error A nullable object that contains the error type, code, and message of the
   *  error that was last encountered by the user. If no error was encountered, error will be null.
   * @param {Object} metadata An object containing information about the user's Link session,
   *  institution selected by the user, and Plaid API request IDs.
   */
  handlePlaidExit = (error) => {
    heapTrackIV({ ACTION: 'exit-plaid', STATUS: (error !== null) ? 'error' : 'success' });
  }

  /**
   * Fires a sign agreement and forgets about it
   */
  handleBeforeOpen = ({ institution = 'other' }) => {
    const {
      plaidAgreementType,
      plaidAgreementVersion
    } = this.props;

    this.setState({
      serverErrorMessage: null
    });

    axios.post('/todo/agreements/submit-plaid-agreement', {
      plaidAgreementType,
      plaidAgreementVersion
    }).then(() => {
      heapTrackIV({
        TYPE: 'Agreement Submission',
        STATUS: 'success'
      });
    }).catch(() => {
      heapTrackIV({
        TYPE: 'Agreement Submission',
        STATUS: 'error'
      });
    });

    heapTrackIV({
      TYPE: 'Click Plaid Bank Logo',
      BANK_NAME: institution
    });
  }

  /**
   * Track to heap the optin success
   */
  handleOptinReturnToTaskList = () => {
    heapTrackIV({
      TYPE: 'Click Optin Success Confirmation'
    });
  }

  /**
   * Track to heap the optout success
   */
  handleOptoutReturnToTaskList = () => {
    heapTrackIV({
      TYPE: 'Click Optout Success Confirmation'
    });
  }

  /**
   * Creates a plaid client using plaid API, external config and handlers.
   */
  createPlaidClient() {
    const {
      plaidClient,
      plaidConfig
    } = this.props;

    if (plaidClient && !this.plaidInstance) {
      this.plaidInstance = plaidClient.create({
        ...plaidConfig,
        onSuccess: this.handlePlaidSuccess,
        onEvent: this.handlePlaidEvent,
        onExit: this.handlePlaidExit
      });
    }
  }

  render() {
    const {
      plaidInstitutionName,
      plaidInstitutionLogo
    } = this.props;

    const {
      showLoader,
      showOptoutModal,
      showSection,
      showOptoutSuccess,
      showPlaidSuccess,
      serverErrorMessage
    } = this.state;

    return (
      <div className="income-verification">
        <div className="todo-body">
          {showSection && (
            <React.Fragment>
              {(showSection === 'bankGallery') && (
                <React.Fragment>
                  <h1 className="todo-heading big">
                    Link your bank so we can confirm your income
                  </h1>
                  <p className="todo-text">
                    Choose the bank where you deposit your paychecks.
                    We will never see your bank username or password.
                  </p>
                  <p className="todo-text">
                    By continuing, you{' '}
                    <a
                      href="/todo/legal-agreement/leg-static-docs/BorrowerBankLinkAuth?format=html"
                      rel="noopener noreferrer"
                      target="_blank"
                      className="todo-link"
                    >
                      authorize the verification
                    </a>
                    {' '}of your income using your bank account.
                  </p>

                  <PlaidGallery
                    onBeforeOpen={this.handleBeforeOpen}
                    plaidInstance={this.plaidInstance}
                  />
                </React.Fragment>
              )}
              {(showSection === 'step1') && (
                <React.Fragment>
                  <h1 className="todo-heading big">
                    We couldn&apos;t verify your income in your {plaidInstitutionName} account
                  </h1>
                  <p className="todo-text">
                    Do you deposit your paycheck into {plaidInstitutionName}?
                  </p>
                  <div className="income-verification__logo-container">
                    {plaidInstitutionLogo ? (
                      <img className="income-verification__logo" alt="" src={`data:image/png;base64,${plaidInstitutionLogo}`} />
                    ) : (
                      <div className="income-verification__logo income-verification__logo--default" />
                    )}
                  </div>

                  <button
                    type="button"
                    className="btn btn-todo center-block margin-bottom-16 income-verification__next-step"
                    onClick={this.handleNextStep}
                  >
                    Yes, I use this bank
                  </button>

                  <button
                    type="button"
                    className="btn btn-todo center-block"
                    onClick={this.handleBankGallery}
                  >
                    No, I use a different bank
                  </button>
                </React.Fragment>
              )}
              {(showSection === 'step2') && (
                <React.Fragment>
                  <h1 className="todo-heading big">
                    Hmm... We couldn&apos;t verify your income through {plaidInstitutionName}
                  </h1>
                  <p className="todo-text">
                    Try connecting a different bank or credit union.
                    You can also upload pay stubs and income documents instead.
                  </p>
                  <button
                    type="button"
                    className="btn btn-todo center-block income-verification__connect-bank"
                    onClick={this.handleBankGallery}
                  >
                    Connect another bank
                  </button>
                </React.Fragment>
              )}

              <div className="todo-text text-center padding-bottom-0 padding-top-32">
                <div className="income-verification__divisor">
                  <hr className="income-verification__divisor--choose" />
                  <span className="income-verification__divisor--legend todo-text">or</span>
                  <hr className="income-verification__divisor--choose" />
                </div>

                <button
                  type="button"
                  className="income-verification__show-optout-link btn-todo-link"
                  onClick={this.handleToggleOptout}
                >
                  Upload pay stubs and other documents instead
                </button>

                <p className="todo-text padding-bottom-0">
                  Reviewing uploaded documents can take <strong>3-5 business days</strong>
                </p>
              </div>
            </React.Fragment>
          )}

          {showOptoutModal && (
            <Modal
              title="Upload pay stubs and tax documents instead?"
              onDismiss={this.handleToggleOptout}
              className="todo-modal"
              titleClassName="todo-heading"
            >
              <p className="todo-text">
                You won&apos;t be able to go back and have us verify your income
                using your bank account if you continue.
              </p>
              <button
                type="button"
                className="btn btn-todo income-verification__optout-action btn-todo--fit-text center-block"
                onClick={this.handleSubmitOptout}
              >
                Continue to upload documents
              </button>
              <button
                type="button"
                className="income-verification__optout-back btn-todo-link center-block margin-top-32"
                onClick={this.handleToggleOptout}
              >
                No, go back to connect bank
              </button>
            </Modal>
          )}

          {showOptoutSuccess && (
            <SuccessMessage
              title="Thanks for letting us know"
            >
              <a
                className="btn btn-todo income-verification__optout-success-return-task-list"
                href="/account/myAccount.action"
                onClick={this.handleOptoutReturnToTaskList}
              >
                Return to task list
              </a>
            </SuccessMessage>
          )}

          {showPlaidSuccess && (
            <SuccessMessage
              title="Thank you for completing this task"
            >
              <React.Fragment>
                <p
                  className="todo-text center-block margin-bottom-16"
                >
                  We will verify your income as quickly as possible.
                  If we need anything else, we will send you an email.
                </p>
                <a
                  className="btn btn-todo income-verification__optout-success-return-task-list"
                  href="/account/myAccount.action"
                  onClick={this.handleOptinReturnToTaskList}
                >
                  Return to task list
                </a>
              </React.Fragment>
            </SuccessMessage>
          )}

          {serverErrorMessage && (
            <Timeout
              onTimeout={this.handleHideErrorModal}
            >
              <Modal
                title="Hmm... Something didn't go right"
                className="todo-modal"
                titleClassName="todo-heading"
                onDismiss={this.handleHideErrorModal}
              >
                <p className="todo-text padding-bottom-0">
                  { serverErrorMessage }
                </p>
              </Modal>
            </Timeout>
          )}

          {showLoader && (
            <Loader theme="fixed" />
          )}
        </div>
      </div>
    );
  }
}

export default IncomeVerification;
