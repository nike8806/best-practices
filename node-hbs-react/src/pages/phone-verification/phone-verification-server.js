const Client = require('lc-service-client');
const logger = require('lc-logger');
const config = require('lc-app-config');
const errorHandler = require('service-error-handler');

const ROUTE = config.get('autoRoutes');
const todoPhoneVerificationClient = new Client('PL-TODO-ORCH PHONE VERIFICATION', {
  getStatus: {
    url: config.get('services.todoOrch.host') + config.get('services.todoOrch.phoneVerificationGetStatusPath'),
    method: 'GET'
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
    path: '/:urlType(phone-verification|joint-phone-verification)',
    middleware: ['authorize', 'get-loan-apps', 'get-loan-app-in-progress'],
    action: [
      {
        path: '/',
        middleware: ['navigation-bar-context'],
        get(req, res) {
          let [logType] = req.params.urlType.split('phone-verification');
          logType = logType.toUpperCase();

          const { id: borrowerId } = req.loanAppInProgress
            .borrowers
            .find(({ primary }) => !logType === primary) || {};

          if (!borrowerId) {
            logger.error(
              `${logType}PHONE-VERIFICATION: Secondary borrower was not found`
            );
            return res.render('error/error', {});
          }

          const serviceParams = getServiceParams(borrowerId);
          return todoPhoneVerificationClient.getStatus(serviceParams, (error, result, body) => {
            const serviceStatusError = errorHandler.captureServiceError(error, result, body);
            const phoneVerificationBody = body || null;
            const isTaskNotFound = serviceStatusError && serviceStatusError.statusCode === 400
              && phoneVerificationBody
              && phoneVerificationBody.errors
              && phoneVerificationBody.errors.find(({ code }) => code === 'TASK_NOT_FOUND');

            if (serviceStatusError && !isTaskNotFound) {
              logger.error(
                { error: serviceStatusError },
                `${logType}PHONE-VERIFICATION: Error consuming todoPhoneVerificationClient.getStatus service.`
              );
              return res.render('error/error', {});
            }

            if (serviceStatusError && isTaskNotFound) {
              logger.info(
                `${logType}PHONE-VERIFICATION: Task not found`
              );
              return res.render('error/error', {});
            }

            if (!phoneVerificationBody || phoneVerificationBody.status !== 'OPEN') {
              logger.warn(
                `${logType}PHONE-VERIFICATION: not in OPEN status, redirecting to ${ROUTE.ACCOUNT}`
              );
              return res.redirect(302, ROUTE.ACCOUNT);
            }

            const context = Object.assign({}, req.navigationBarContext, {
              headerTitle: 'Confirm your application'
            });

            logger.info(`${logType}PHONE-VERIFICATION: rendering page`);
            return res.render('phone-verification/phone-verification-template', context);
          });
        }
      }
    ]
  });
};
