import React, { Component } from 'react';
import {
  SuccessMessage, Input, Loader, Modal, Timeout
} from 'components';
import axios from 'lc-axios';
import PropTypes from 'prop-types';
import classnames from 'classnames';
import { validate } from 'ui-validator';
import schema from './link-bank-account-validation-schema';

import checkSample from './images/check-sample.png';

const ACCOUNT_TYPE_CHECKING = 'EXT_CHECKING';
const ACCOUNT_TYPE_SAVINGS = 'EXT_SAVINGS';
const DEFAULT_ERROR = 'Something went wrong. Please try again later.';

/**
 * Handles all interactions with Link Bank Account
 */
class LinkBankAccount extends Component {
  static propTypes = {
    onPaymentOptionChangeRequest: PropTypes.func
  };

  static defaultProps = {
    onPaymentOptionChangeRequest: null
  };

  state = {
    showFormSection: true,
    showPaymentOptionsSection: false,
    modalMessage: null,
    showLoader: false,
    accountType: '',
    accountHolderFirstName: '',
    accountHolderLastName: '',
    institution: '',
    routingNumber: '',
    accountNumber: '',
    confirmAccountNumber: '',
    bankAccountAgreement: false,
    paymentAgreement: false,
    hasPayByCheck: false,
    inputErrorMessages: {
      accountType: null,
      accountHolderFirstName: null,
      accountHolderLastName: null,
      institution: null,
      routingNumber: null,
      accountNumber: null,
      confirmAccountNumber: null,
      bankAccountAgreement: null,
      paymentAgreement: null
    },
    touched: {
      accountType: false,
      accountHolderFirstName: false,
      accountHolderLastName: false,
      institution: false,
      routingNumber: false,
      accountNumber: false,
      confirmAccountNumber: false,
      bankAccountAgreement: false,
      paymentAgreement: false
    }
  };

  componentDidMount() {
    const {
      accountType,
      accountHolderFirstName,
      accountHolderLastName,
      institution,
      routingNumber,
      accountNumber,
      confirmAccountNumber,
      bankAccountAgreement,
      paymentAgreement
    } = this.state;

    this.setState({
      inputErrorMessages: {
        accountType: this.validateInput({ accountType }),
        accountHolderFirstName: this.validateInput({ accountHolderFirstName }),
        accountHolderLastName: this.validateInput({ accountHolderLastName }),
        institution: this.validateInput({ institution }),
        routingNumber: this.validateInput({ routingNumber }),
        accountNumber: this.validateInput({ accountNumber }),
        confirmAccountNumber: this.validateInput({ confirmAccountNumber }),
        bankAccountAgreement: this.validateInput({ bankAccountAgreement }),
        paymentAgreement: this.validateInput({ paymentAgreement })
      }
    });
  }

  /**
   * Function to toggle the payment option section
   */
  togglePaymentOptionsSection = () => {
    this.setState(({ showPaymentOptionsSection }) => ({
      showPaymentOptionsSection: !showPaymentOptionsSection
    }));
  };

  handlePaymentOptionChangeRequest = () => {
    const {
      onPaymentOptionChangeRequest
    } = this.props;

    if (onPaymentOptionChangeRequest) {
      onPaymentOptionChangeRequest();
    }
  }

  /**
   * Method to trigger hasPayByCheck from outside the container
   */
  setPayByCheck = (hasPayByCheck) => {
    this.setState({
      hasPayByCheck,
      showPaymentOptionsSection: false,
    }, () => {
      // We need to update the validation state using the updated hasPayByCheck
      this.setState(({ inputErrorMessages, paymentAgreement }) => ({
        inputErrorMessages: {
          ...inputErrorMessages,
          paymentAgreement: this.validateInput({ paymentAgreement })
        }
      }));
    });
  };

  validateInput = (data) => {
    const { accountNumber, hasPayByCheck } = this.state;
    let name = Object.keys(data)[0];

    const agreementType = (name === 'paymentAgreement' && (hasPayByCheck ? 'paymentAgreementByCheck' : 'paymentAgreementElectronically')) || null;
    name = agreementType || name;

    const error = validate({
      ...data,
      ...(agreementType ? { [agreementType]: data.paymentAgreement } : {}),
      ...(name === 'confirmAccountNumber' ? { accountNumber } : {}),
    }, { [name]: schema[name] });

    const errors = error[name];
    const errorsArray = errors && Object.keys(errors);
    return (errorsArray && errorsArray.length && errors[errorsArray[0]]) || null;
  };

  /**
   * Function to handle the changes in all inputs
   */
  handleInputChange = ({ target }) => {
    const { name } = target;
    const value = target.type === 'checkbox' ? target.checked : target.value;

    const error = this.validateInput({ [name]: value });
    this.setState(({ inputErrorMessages }) => ({
      [name]: value,
      inputErrorMessages: {
        ...inputErrorMessages,
        [name]: error
      }
    }));
  };

  /**
   * Handle if input was touched
   */
  handleInputBlur = ({ target }) => {
    const { name } = target;
    const value = target.type === 'checkbox' ? target.checked : target.value;

    const error = this.validateInput({ [name]: value });
    this.setState(({ inputErrorMessages, touched }) => ({
      inputErrorMessages: {
        ...inputErrorMessages,
        [name]: error
      },
      touched: {
        ...touched,
        [name]: true
      }
    }));
  }

  /**
   * Function to handle the submit request
   */
  handleSubmit = () => {
    const {
      accountType,
      accountHolderFirstName,
      accountHolderLastName,
      institution,
      routingNumber,
      accountNumber,
      confirmAccountNumber,
      bankAccountAgreement,
      paymentAgreement,
      hasPayByCheck,
      inputErrorMessages
    } = this.state;

    this.setState({
      touched: {
        accountType: true,
        accountHolderFirstName: true,
        accountHolderLastName: true,
        institution: true,
        routingNumber: true,
        accountNumber: true,
        confirmAccountNumber: true,
        bankAccountAgreement: true,
        paymentAgreement: true
      }
    });

    const isInvalidForm = Object.keys(inputErrorMessages)
      .find(input => (!this.state[input] || inputErrorMessages[input]));
    if (isInvalidForm) {
      return;
    }

    this.setState({
      showLoader: true,
      modalMessage: null
    });

    const data = {
      accountType,
      accountHolderFirstName,
      accountHolderLastName,
      institution,
      routingNumber,
      accountNumber,
      confirmAccountNumber,
      bankAccountAgreement,
      paymentAgreement,
      hasPayByCheck
    };

    axios.post('/todo/link-bank-account/submit', data)
      .then(() => this.setState({
        showLoader: false,
        showFormSection: false
      }))
      .catch((error) => {
        this.setState({
          showLoader: false,
          modalMessage:
            error.response
            && error.response.data.errors
            && error.response.data.errors.length > 0
              ? error.response.data.errors
              : DEFAULT_ERROR
        });
      });
  };

  /**
   * Handler for Modal onDismiss event
   */
  handleDismissModal = () => {
    this.setState({
      modalMessage: null
    });
  };

  /**
   * Get error message for input if exists one
   */
  getErrorMessage = (inputName) => {
    const {
      touched,
      inputErrorMessages
    } = this.state;

    return (touched[inputName] && inputErrorMessages[inputName]) || null;
  }

  render() {
    const {
      showFormSection,
      modalMessage,
      showPaymentOptionsSection,
      hasPayByCheck,
      showLoader,
      accountType,
      accountHolderFirstName,
      accountHolderLastName,
      institution,
      routingNumber,
      accountNumber,
      confirmAccountNumber,
      bankAccountAgreement,
      paymentAgreement,
      inputErrorMessages,
      touched
    } = this.state;

    const paymentOptionsArrowClassname = classnames(
      'link-bank-account__payment-options-arrow',
      'todo-collapsable-arrow',
      {
        'todo-collapsable-arrow--down': showPaymentOptionsSection
      }
    );

    const accountTypeErrorMessage = touched.accountType
      && inputErrorMessages.accountType;
    const bankAccountAgreementErrorMessage = touched.bankAccountAgreement
      && inputErrorMessages.bankAccountAgreement;
    const paymentAgreementErrorMessage = touched.paymentAgreement
      && inputErrorMessages.paymentAgreement;

    return (
      <div className="link-bank-account">
        <div className="todo-body">
          {showFormSection && (
            <div className="link-bank-account__main-section">
              <h1 className="todo-heading big">
                Tell us where to deposit your loan proceeds
              </h1>

              <p className="todo-text">
                Link your bank account. Your money will be deposited in this account.
              </p>

              <div className="padding-bottom-16">
                <label
                  htmlFor="link-bank-account-firstname"
                  className="todo-text"
                >
                  First Name
                </label>
                <Input
                  id="link-bank-account-firstname"
                  type="text"
                  name="accountHolderFirstName"
                  inputClassName="link-bank-account__account-holder-first-name-input"
                  required
                  errorMessage={this.getErrorMessage('accountHolderFirstName')}
                  value={accountHolderFirstName}
                  onBlur={this.handleInputBlur}
                  onChange={this.handleInputChange}
                />
              </div>

              <div className="padding-bottom-16">
                <label
                  htmlFor="link-bank-account-lastname"
                  className="todo-text"
                >
                  Last Name
                </label>
                <Input
                  id="link-bank-account-lastname"
                  type="text"
                  name="accountHolderLastName"
                  inputClassName="link-bank-account__account-holder-last-name-input"
                  required
                  errorMessage={this.getErrorMessage('accountHolderLastName')}
                  value={accountHolderLastName}
                  onBlur={this.handleInputBlur}
                  onChange={this.handleInputChange}
                />
              </div>

              <div className="padding-bottom-32">
                <label
                  htmlFor="link-bank-account-bank-name"
                  className="todo-text"
                >
                  Bank Name
                </label>
                <Input
                  id="link-bank-account-bank-name"
                  type="text"
                  name="institution"
                  inputClassName="link-bank-account__institution-input"
                  required
                  errorMessage={this.getErrorMessage('institution')}
                  value={institution}
                  onBlur={this.handleInputBlur}
                  onChange={this.handleInputChange}
                />
              </div>

              <ul className="link-bank-account__account-types nav-horizontal padding-left-0 margin-bottom-24">
                <li className="link-bank-account__account-type margin-all-0">
                  <input
                    id="link-bank-account-type-checking"
                    type="radio"
                    name="accountType"
                    className="link-bank-account__radio"
                    value={ACCOUNT_TYPE_CHECKING}
                    checked={accountType === ACCOUNT_TYPE_CHECKING}
                    onChange={this.handleInputChange}
                  />
                  <label
                    className="link-bank-account__account-type__label todo-text padding-left-10"
                    htmlFor="link-bank-account-type-checking"
                  >
                    Checking
                  </label>
                </li>

                <li className="link-bank-account__account-type margin-all-0">
                  <input
                    id="link-bank-account-type-savings"
                    type="radio"
                    name="accountType"
                    className="link-bank-account__radio"
                    value={ACCOUNT_TYPE_SAVINGS}
                    checked={accountType === ACCOUNT_TYPE_SAVINGS}
                    onChange={this.handleInputChange}
                  />
                  <label
                    className="link-bank-account__account-type__label todo-text padding-left-10"
                    htmlFor="link-bank-account-type-savings"
                  >
                    Savings
                  </label>
                </li>
                {accountTypeErrorMessage && (
                  <div className="error-message">
                    <span className="icon icon-form-error error-image" />
                    <span className="error-text">{accountTypeErrorMessage}</span>
                  </div>
                )}
              </ul>

              <img
                className="img-responsive margin-bottom-32 center-block"
                src={checkSample}
                alt="Check sample showing routing number and account number positions"
              />

              <div className="padding-bottom-16">
                <label
                  htmlFor="link-bank-account-routing-number"
                  className="todo-text"
                >
                  Routing Number
                </label>
                <Input
                  id="link-bank-account-routing-number"
                  type="text"
                  name="routingNumber"
                  inputClassName="link-bank-account__routing-number-input"
                  required
                  errorMessage={this.getErrorMessage('routingNumber')}
                  value={routingNumber}
                  onBlur={this.handleInputBlur}
                  onChange={this.handleInputChange}
                />
              </div>

              <div className="padding-bottom-16">
                <label
                  htmlFor="link-bank-account-account-number"
                  className="todo-text"
                >
                  Account Number
                </label>
                <Input
                  id="link-bank-account-account-number"
                  type="text"
                  name="accountNumber"
                  inputClassName="link-bank-account__account-number-input"
                  required
                  errorMessage={this.getErrorMessage('accountNumber')}
                  value={accountNumber}
                  onBlur={this.handleInputBlur}
                  onChange={this.handleInputChange}
                />
              </div>

              <div className="padding-bottom-32">
                <label
                  htmlFor="link-bank-account-confirm-account-number"
                  className="todo-text"
                >
                  Confirm Account Number
                </label>
                <Input
                  id="link-bank-account-confirm-account-number"
                  type="text"
                  name="confirmAccountNumber"
                  inputClassName="link-bank-account__confirm-account-number-input"
                  required
                  errorMessage={this.getErrorMessage('confirmAccountNumber')}
                  value={confirmAccountNumber}
                  onBlur={this.handleInputBlur}
                  onChange={this.handleInputChange}
                />
              </div>

              <p className="todo-text padding-bottom-16">
                Clicking the box below constitutes your electronic signature to the authorization.
              </p>

              <div className="padding-bottom-16 link-bank-account__agreement">
                <input
                  id="link-bank-account-authorization-agreement"
                  type="checkbox"
                  name="bankAccountAgreement"
                  className="link-bank-account__bank-account-agreement__checkbox"
                  checked={bankAccountAgreement}
                  onChange={this.handleInputChange}
                  onBlur={this.handleInputBlur}
                  onClick={this.handleInputBlur}
                />
                <label
                  htmlFor="link-bank-account-authorization-agreement"
                  className="link-bank-account__bank-account-agreement__label todo-text padding-left-10"
                >
                  authorization to
                  {' '}
                  <a
                    href="https://www.lendingclub.com/info/borrower-bank-account-verification.action"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="todo-link"
                  >
                      verify your bank account
                  </a>
                  .
                </label>
                {bankAccountAgreementErrorMessage && (
                  <div className="error-message">
                    <span className="icon icon-form-error error-image" />
                    <span className="error-text">{bankAccountAgreementErrorMessage}</span>
                  </div>
                )}
              </div>

              <div className="padding-bottom-32 link-bank-account__agreement">
                <input
                  id="link-bank-account-payment-agreement"
                  type="checkbox"
                  name="paymentAgreement"
                  className="link-bank-account__payment-agreement__checkbox"
                  checked={paymentAgreement}
                  onChange={this.handleInputChange}
                  onBlur={this.handleInputBlur}
                  onClick={this.handleInputBlur}
                />

                <label
                  htmlFor="link-bank-account-payment-agreement"
                  className="link-bank-account__payment-agreement__label padding-left-10"
                >
                  {hasPayByCheck ? (
                    <span className="todo-text">
                      your confirmation that you will make payments by check.
                    </span>
                  ) : (
                    <span className="todo-text">
                        your authorization to take payments
                      {' '}
                      <a
                        href="https://www.lendingclub.com/legal/authorization-for-automatic-payments"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="todo-link"
                      >
                          electronically
                      </a>
                      {' '}
                        from your bank account.
                    </span>
                  )
                  }
                </label>
                {' '}
                <button
                  type="button"
                  className="visible-inline btn-todo-link"
                  onClick={this.togglePaymentOptionsSection}
                >
                  Change this
                  <i className={paymentOptionsArrowClassname} />
                </button>

                {showPaymentOptionsSection
                  && (
                  <div className="alert todo-text padding-bottom-10">
                    {hasPayByCheck ? (
                      <React.Fragment>
                        You will need to send your monthly payment in on your own,
                        with an additional $7 check processing fee added to the amount.
                        {' '}
                        <button
                          type="button"
                          className="visible-inline btn-todo-link"
                          onClick={this.handlePaymentOptionChangeRequest}
                        >
                          Change this
                        </button>.
                      </React.Fragment>
                    ) : (
                      <React.Fragment>
                        If you do nothing, each monthly payment will be automatically taken from
                        your bank account without any fees.
                        You can also pay by check. You can
                        {' '}
                        <button
                          type="button"
                          className="visible-inline btn-todo-link"
                          onClick={this.handlePaymentOptionChangeRequest}
                        >
                          change this payment option
                        </button>
                        {' '}
                        at any time.
                      </React.Fragment>
                    )}
                  </div>
                  )
                }
                {paymentAgreementErrorMessage && (
                  <div className="error-message">
                    <span className="icon icon-form-error error-image" />
                    <span className="error-text">{paymentAgreementErrorMessage}</span>
                  </div>
                )}
              </div>

              <button
                type="button"
                className="btn btn-todo center-block link-bank-account__btn-submit"
                onClick={this.handleSubmit}
              >
                Submit
              </button>
            </div>
          )}

          {!showFormSection && (
            <SuccessMessage
              title="Thank you for completing this task"
              subtitle="Please be sure to finish the rest of your task list."
              className="link-bank-account__result-section"
            >
              <a
                className="btn btn-todo"
                href="/account/myAccount.action"
              >
                Return to task list
              </a>
            </SuccessMessage>
          )}

          {modalMessage && (
            <Timeout
              delay={5000}
              onTimeout={this.handleDismissModal}
            >
              <Modal
                className="link-bank-account__modal todo-modal"
                onDismiss={this.handleDismissModal}
              >
                <ul className="list-unstyled todo-text padding-bottom-0">
                  {Array.isArray(modalMessage) ? (
                    modalMessage.map(({ error }, i) => (
                      <li key={i}>{error}</li>
                    ))
                  ) : (
                    <li>{modalMessage}</li>
                  )}
                </ul>
              </Modal>
            </Timeout>
          )}
        </div>
        {showLoader && (
          <Loader theme="fixed" />
        )}
      </div>
    );
  }
}

export default LinkBankAccount;
