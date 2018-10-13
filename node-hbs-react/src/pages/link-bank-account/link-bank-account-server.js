const Client = require('lc-service-client');
const logger = require('lc-logger');
const config = require('lc-app-config');

const ROUTE = config.get('autoRoutes');
const errorHandler = require('service-error-handler');

const POST_SUBMIT_ERRORS = {
  MISSING_PRIMARY_ACCT_HOLDER_FIRSTNAME: 'The first name of the Primary account holder is required',
  MISSING_PRIMARY_ACCT_HOLDER_LASTNAME: 'The last name of the Primary account holder is required',
  INVALID_BANK_ACCOUNT_NUMBER: 'Please enter your account number using only numbers, without any dashes, spaces or letters',
  ACCOUNT_NUMBER_MISMATCH: 'Account number does not match',
  INVALID_PRIMARY_ACCT_TYPE: 'An account type is required',
  MISSING_PRIMARY_ACCT_TYPE: 'An account type is required',
  MUST_ACCEPT_BANK_ACCOUNT_AND_PAYMENT_AGREEMENT: 'Please provide authorization at the bottom of the page to verify your bank account and to make payments electronically. If you don\'t want to make payments electronically, you can choose to pay by check by clicking the "change this" link at the bottom of the page.',
  BANK_ACCOUNT_LINK_INVALID_FUNNEL: 'Invalid funnel value, unable to submit bank account link',
  MISSING_PRIMARY_ACCT_INSTITUTION: 'A bank name is required',
  INVALID_ROUTING_NUMBER: 'A valid routing number is required',
  MISSING_ROUTING_NUMBER: 'A valid routing number is required',
  SERVER_ERROR: 'Something went wrong. Please try again later.'
};

/**
 * Client for link bank account
 */
const todoLinkBankAccountClient = new Client('PL-TODO-ORCH LINK BANK ACCOUNT', {
  getStatus: {
    url: config.get('services.todoOrch.host') + config.get('services.todoOrch.linkBankAccountGetStatusPath'),
    method: 'GET'
  },
  postSubmit: {
    url: config.get('services.todoOrch.host') + config.get('services.todoOrch.linkBankAccountSubmitPath'),
    method: 'POST'
  }
});

/**
 * Returns the parameters needed for lc-service-client
 * to build url for calling services in a single object.
 * @param {Number} partyId Actor Id
 */
const getServiceParams = partyId => ({
  listGuid: '123e4567-e89b-42d3-a456-556642440000',
  taskGuid: '123e4567-e89b-42d3-a456-556642440000',
  externalId: `1000-${partyId}`
});

module.exports = (boreas, register) => {
  register(null, {
    path: '/link-bank-account',
    middleware: ['authorize', 'get-loan-apps', 'get-loan-app-in-progress'],
    action: [
      {
        path: '/',
        middleware: ['navigation-bar-context'],
        get(req, res) {
          const serviceParams = getServiceParams(req.loanAppInProgressActorId);

          todoLinkBankAccountClient.getStatus(serviceParams, (error, result, body) => {
            const serviceStatusError = errorHandler.captureServiceError(error, result, body);
            if (serviceStatusError) {
              logger.error({ error: serviceStatusError }, 'LINK BANK ACCOUNT: Error consuming todolinkBankAccountClient.getStatus service.');
              return res.render('error/error', {});
            }

            const linkBankAccountBody = result.body;
            if (!linkBankAccountBody || linkBankAccountBody.status !== 'OPEN') {
              logger.info(`LINK BANK ACCOUNT: not in OPEN status, redirecting to ${ROUTE.ACCOUNT}`);
              return res.redirect(302, ROUTE.ACCOUNT);
            }

            const context = Object.assign({}, req.navigationBarContext, {
              headerTitle: 'Link your bank account'
            });
            return res.render('link-bank-account/link-bank-account-template', context);
          });
        }
      },
      {
        /**
         * Endpoint to submit the data to link bank account
         * @param {object} req object
         * @param {string} req.body.accountType
         * @param {string} req.body.accountHolderFirstName
         * @param {string} req.body.accountHolderLastName
         * @param {string} req.body.institution
         * @param {string} req.body.routingNumber
         * @param {string} req.body.accountNumber
         * @param {string} req.body.confirmAccountNumber
         * @param {boolean} req.body.bankAccountAgreement
         * @param {boolean} req.body.paymentAgreement
         * @param {boolean} req.body.hasPayByCheck
        */
        path: '/submit',
        post(req, res) {
          const serviceParams = getServiceParams(req.loanAppInProgressActorId);
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
            hasPayByCheck
          } = req.body;

          const agreements = [];

          if (bankAccountAgreement) {
            agreements.push({
              accepted: true,
              type: 'BANK_ACCOUNT_AGREEMENT',
              version: 'LATEST'
            });
          }

          if (paymentAgreement) {
            agreements.push({
              accepted: true,
              type: hasPayByCheck ? 'PAY_BY_CHECK_AGREEMENT' : 'ELECTRONIC_PAYMENT_AGREEMENT',
              version: 'LATEST'
            });
          }

          const data = {
            accountHolderFirstName,
            accountHolderLastName,
            accountNumber,
            accountType,
            agreements,
            confirmAccountNumber,
            funnelLabel: 'C',
            institution,
            routingNumber,
            useExistingAccount: false
          };

          todoLinkBankAccountClient
            .postSubmit(serviceParams, { body: data }, (errorSubmit, resultSubmit, bodySubmit) => {
              const servicePostSubmitError = errorHandler
                .captureServiceError(errorSubmit, resultSubmit, bodySubmit);

              if (servicePostSubmitError) {
                logger.error({
                  error: servicePostSubmitError,
                  result: resultSubmit
                }, 'LINK BANK ACCOUNT: Error consuming todoLinkBankAccountClient.postSubmit service.');
                const statusCode = (servicePostSubmitError.statusCode === 200)
                  ? 500 : servicePostSubmitError.statusCode;

                const { errors } = servicePostSubmitError;
                const errorResponse = { errors: [] };

                errors.forEach((error) => {
                  if (errorResponse.errors.findIndex(err => error.code === err.errorCode || error.message === err.errorCode) === -1) {
                    errorResponse.errors.push({
                      // To correctly give an errorCode we look for the code in the message because
                      // the errors returned by the endpoint have the code in the message
                      errorCode: POST_SUBMIT_ERRORS[error.code] ? error.code : error.message,
                      error: POST_SUBMIT_ERRORS[error.code]
                        || POST_SUBMIT_ERRORS[error.message]
                        || POST_SUBMIT_ERRORS.SERVER_ERROR
                    });
                  }
                });

                return res.status(statusCode).json(errorResponse);
              }

              return res.status(200).json(resultSubmit.body);
            });
        }
      }
    ]
  });
};
