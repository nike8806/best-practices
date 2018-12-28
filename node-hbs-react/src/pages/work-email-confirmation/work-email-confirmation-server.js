const Client = require('lc-service-client');
const logger = require('lc-logger');
const config = require('lc-app-config');

const ROUTE = config.get('autoRoutes');
const errorHandler = require('service-error-handler');

const todoWorkEmailClient = new Client('PL-TODO-ORCH EMAIL CONFIRMATION', {
  getStatus: {
    url: config.get('services.todoOrch.host') + config.get('services.todoOrch.statusWorkEmailPath'),
    method: 'GET'
  },
  submitWorkEmail: {
    url: config.get('services.todoOrch.host') + config.get('services.todoOrch.submitWorkEmailPath'),
    method: 'POST'
  },
  optOut: {
    url: config.get('services.todoOrch.host') + config.get('services.todoOrch.optOutWorkEmailPath'),
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
    path: '/work-email-confirmation',
    middleware: ['authorize', 'get-loan-app-in-progress'],
    action: [
      {
        path: '/',
        middleware: ['navigation-bar-context'],
        get(req, res) {
          const serviceParams = getServiceParams(req.loanAppInProgressActorId);
          todoWorkEmailClient.getStatus(serviceParams, (errorStatus, resultStatus, bodyStatus) => {
            const serviceStatusError = errorHandler.captureServiceError(
              errorStatus, resultStatus, bodyStatus
            );
            const isTaskNotFound = serviceStatusError
              && serviceStatusError.errors
              && serviceStatusError.errors.find(({ code }) => code === 'TASK_NOT_FOUND');

            if (isTaskNotFound) {
              logger.warn(
                { error: serviceStatusError.errors || 'NO_ERRORS' },
                'WORK-EMAIL-CONFIRMATION: Task not found from getStatus service.'
              );
              return res.render('error/error', {});
            }

            if (serviceStatusError) {
              logger.error(
                { error: serviceStatusError.errors || 'NO_ERRORS' },
                'WORK-EMAIL-CONFIRMATION: Error consuming getStatus service.'
              );
              return res.render('error/error', {});
            }

            const workEmailConfirmation = resultStatus.body;
            if (!workEmailConfirmation || (workEmailConfirmation.status !== 'OPEN' && workEmailConfirmation.status !== 'INCOMPLETE')) {
              logger.info(`WORK-EMAIL-CONFIRMATION: not in OPEN status, redirecting to ${ROUTE.ACCOUNT}`);
              return res.redirect(302, ROUTE.ACCOUNT);
            }

            const context = Object.assign({}, req.navigationBarContext, {
              headerTitle: 'Confirm Your Employment'
            });

            return res.render('work-email-confirmation/work-email-confirmation-template', context);
          });
        }
      },
      {
        path: '/send',
        post(req, res) {
          const { email } = req.body;
          if (!email) {
            logger.error(req.body, 'Required information not included in request.');
            return res.status(400).json({ error: 'One of the request inputs is not valid' });
          }

          const sendLink = getServiceParams(req.loanAppInProgressActorId);
          return todoWorkEmailClient.submitWorkEmail(
            sendLink, { body: { email } }, (error, result, body) => {
              const serviceError = errorHandler.captureServiceError(error, result, body);
              if (serviceError) {
                const statusCode = (serviceError.statusCode === 200)
                  ? 500 : serviceError.statusCode;
                logger.error({ error: serviceError }, 'Error consuming submitWorkEmail service.');
                return res.status(statusCode).json({ error: 'Error consuming submitWorkEmail service' });
              }
              return res.status(200).json(result.body);
            }
          );
        }
      },
      {
        path: '/optout',
        post(req, res) {
          if (!req.body.reason) {
            logger.error(req.body, 'Required information not included in request.');
            return res.status(400).json({ error: 'One of the request inputs is not valid' });
          }

          const optOutWorkEmailLink = getServiceParams(req.loanAppInProgressActorId);
          return todoWorkEmailClient.optOut(
            optOutWorkEmailLink,
            { body: { optedOutVerificationOption: req.body.reason } },
            (error, result, body) => {
              const serviceError = errorHandler.captureServiceError(error, result, body);
              if (serviceError) {
                const statusCode = (serviceError.statusCode === 200)
                  ? 500 : serviceError.statusCode;
                logger.error({ error: serviceError }, `Error consuming optOutWorkEmail service. ${serviceError.statusCode}`);
                return res.status(statusCode).json({ error: 'Error consuming optOutWorkEmail service' });
              }

              return res.status(200).json(result.body);
            }
          );
        }
      }
    ]
  });
};
