const async = require('async');
const Plaid = require('plaid');
const config = require('lc-app-config');
const Client = require('lc-service-client');
const logger = require('lc-logger');
const pbsClient = require('pbs-client');
const agreementLinks = require('agreement-links');
const errorHandler = require('service-error-handler');

const ROUTE = config.get('autoRoutes');

/**
 * Income Verification Client, handles calls to Income Verification services
 */
const incomeVerificationClient = new Client('PL-TODO-ORCH INCOME VERIFICATION', {
  getStatus: {
    url: config.get('services.todoOrch.host') + config.get('services.todoOrch.incomeVerificationGetStatusPath'),
    method: 'GET'
  },
  optout: {
    url: config.get('services.todoOrch.host') + config.get('services.todoOrch.incomeVerificationOptoutPath'),
    method: 'POST'
  },
  optin: {
    url: config.get('services.todoOrch.host') + config.get('services.todoOrch.incomeVerificationOptInPath'),
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
    path: '/income-verification',
    middleware: ['authorize', 'get-loan-apps', 'get-loan-app-in-progress'],
    action: [
      {
        path: '/',
        middleware: ['validate-supported-actor', 'navigation-bar-context'],
        get(req, res) {
          const serviceParams = getServiceParams(req.loanAppInProgressActorId);
          incomeVerificationClient.getStatus(serviceParams, (error, result, bodyStatus) => {
            const serviceStatusError = errorHandler.captureServiceError(error, result, bodyStatus);
            const taskNotFound = bodyStatus && bodyStatus.errors && bodyStatus.errors.find(e => e.code === 'TASK_NOT_FOUND');
            if (serviceStatusError && !taskNotFound) {
              logger.error({ error: serviceStatusError }, 'INCOME-VERIFICATION: could not load page');
              return res.render('error/error', {});
            }

            const body = result.body;
            if (!body || body.status !== 'OPEN') {
              logger.info('INCOME-VERIFICATION: not in OPEN status, redirecting to ' + ROUTE.ACCOUNT);
              return res.redirect(302, ROUTE.ACCOUNT);
            }

            const currentProduct = req.product;
            let bankAgreement = {};

            const bankAccountPipeline = {
              agreements: function getAgreementsPipeline(callback) {
                pbsClient.getLatestAgreements(currentProduct.ids[0], function(error, latestAgreements) {
                  if (error) {
                    logger.error(error, 'INCOME-VERIFICATION: Error getting latestAgreements');
                    return callback(error);
                  }

                  logger.info('INCOME-VERIFICATION: Successfully get latestAgreements');

                  const links = agreementLinks.getAgreementLinks(currentProduct.name, latestAgreements);
                  bankAgreement = links.BorrowerBankLinkAuth;

                  return callback(null, null);
                });
              },
              getPlaidData: function getPlaidDataPipeline(callback) {
                Plaid.api.prepareContext(req.loanAppInProgressActorId, function(error, plaidData) {
                  if (error) {
                    logger.error(error, 'INCOME-VERIFICATION: Error getting plaidData');
                  }

                  logger.info({hasPlaidData: !!(plaidData && plaidData.hasPlaidData)}, 'INCOME-VERIFICATION: Successfully get plaidData');

                  return callback(null, plaidData || {});
                });
              }
            };

            async.parallel(bankAccountPipeline, function bankAccountPipelineAsyncCallback(errors, results) {
              if (errors) {
                logger.error(errors, 'INCOME-VERIFICATION: Error getting Agreements/Plaid data');
                return res.render('error/error', {});
              }

              const context = Object.assign({}, req.navigationBarContext, {
                headerTitle: 'Verify your income'
              });

              const plaidConfig = Plaid.utils.getPlaidEnvConfig();
              const plaidData = results.getPlaidData;

              context.plaidConfig = JSON.stringify({
                clientName: 'LendingClub',
                product: ['transactions'],
                selectAccount: true,
                env: plaidConfig.plaidEnv,
                key: plaidConfig.plaidPublicKey,
                apiVersion: 'v2'
              });
              context.plaidData = JSON.stringify({
                plaidAgreementType: bankAgreement.type,
                plaidAgreementVersion: parseInt(bankAgreement.version, 10),
                institutionName: plaidData.institutionName,
                hasPlaidData: plaidData.hasPlaidData,
                institutionLogo: plaidData.logo
              });

              return res.render('income-verification/income-verification-template', context);
            });
          });
        }
      },
      {
        path: '/optout',
        /**
         * POST request to Optout Service.
         * @param {Object} req Request object.
         * @param {Object} res Response handler.
         */
        post(req, res) {
          const serviceParams = getServiceParams(req.loanAppInProgressActorId);

          incomeVerificationClient.optout(serviceParams, (errorOptout, resultOptout, bodyOptout) => {
            const serviceOptoutError = errorHandler.captureServiceError(errorOptout, resultOptout, bodyOptout);
            if (serviceOptoutError) {
              const statusCode = (serviceOptoutError.statusCode === 200) ? 500 : serviceOptoutError.statusCode;
              logger.error({ error: serviceOptoutError }, 'INCOME-VERIFICATION-OPTOUT: Error consuming Optout service.');
              return res.status(statusCode).json({ error: 'Error consuming Optout service' });
            }

            logger.info('INCOME-VERIFICATION-OPTOUT: optout done');
            return res.status(200).json({
              status: 'SUBMITTED'
            });
          });
        }
      },
      {
        path: '/optin',
        /*
         * POST request to OptIn Service.
         * @param {Object} req Request object.
         * @param {Object} res Response handler.
         * @param {String} req.body.agreementType Type of agreement
         * @param {String} req.body.agreementVersion Agreement Version
         * @param {String} req.body.publicToken Plaid Info
         * @param {String} req.body.plaidInstitutionAccountId Plaid Info
         */
        post(req, res) {
          const serviceParams = getServiceParams(req.loanAppInProgressActorId);
          const payload = {
            agreementType: req.body.plaidAgreementType,
            agreementVersion: req.body.plaidAgreementVersion,
            publicToken: req.body.public_token,
            initializedProducts: ['auth', 'transactions', 'identity'],
            plaidInstitutionAccountId: req.body.account_id
          };

          incomeVerificationClient.optin(serviceParams, { body: payload }, (errorOptin, resultOptin, bodyOptin) => {
            const serviceOptinError = errorHandler.captureServiceError(errorOptin, resultOptin, bodyOptin);
            if (serviceOptinError) {
              const statusCode = (serviceOptinError.statusCode === 200) ? 500 : serviceOptinError.statusCode;
              logger.error({ error: serviceOptinError }, 'INCOME-VERIFICATION-OPTIN: Error consuming Optin service.');
              return res.status(statusCode).json({ error: 'Error consuming Optin service' });
            }

            logger.info({url: serviceParams}, 'INCOME-VERIFICATION-OPTIN: Optin POST successful');
            return res.status(200).json({
              status: 'SUBMITTED'
            });
          });
        }
      }
    ]
  });
};
