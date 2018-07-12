const Client = require('lc-service-client');
const logger = require('lc-logger');
const config = require('lc-app-config');
const ROUTE = config.get('autoRoutes');

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
const getServiceParams = (partyId) => ({
  listGuid: '123e4567-e89b-42d3-a456-556642440000',
  taskGuid: '123e4567-e89b-42d3-a456-556642440000',
  externalId: `1000-${partyId}`
});

module.exports = (boreas, register) => {
  register(null, {
    path: '/work-email-confirmation',
    middleware: ['authorize', 'get-loan-apps', 'get-loan-app-in-progress'],
    action: [
      {
        path: '/',
        middleware: ['navigation-bar-context'],
        get(req, res) {
          const serviceParams = getServiceParams(req.loanAppInProgressActorId);
          todoWorkEmailClient.getStatus(serviceParams, (error, result) => {
            if (error || !result) {
              logger.error({error: error}, 'WORK-EMAIL-CONFIRMATION: Error consuming getStatus service.');
              return res.render('error/error', {});
            }

            const workEmailConfirmation = result.body;
            if (!workEmailConfirmation || (workEmailConfirmation.status !== 'OPEN' && workEmailConfirmation.status !== 'INCOMPLETE')) {
              logger.info('WORK-EMAIL-CONFIRMATION: not in OPEN status, redirecting to ' + ROUTE.ACCOUNT);
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
          if (!req.body.email) {
            logger.error(req.body, 'Required information not included in request.');
            return res.status(400).send({ error: 'One of the request inputs is not valid' });
          }

          const sendLink = getServiceParams(req.loanAppInProgressActorId);
          todoWorkEmailClient.submitWorkEmail(sendLink, { body: {email: req.body.email} }, function(error, result) {
            if (error || !result) {
              const response = error.response;

              logger.error(response, 'Error consuming submitWorkEmail service. ' + response.statusText);
              return res.status(response.status).send({ error: 'Error consuming submitWorkEmail service' });
            }

            return res.status(200).send(result.body);
          });
        }
      },
      {
        path: '/optout',
        post(req, res) {
          if (!req.body.reason) {
            logger.error(req.body, 'Required information not included in request.');
            return res.status(400).send({ error: 'One of the request inputs is not valid' });
          }

          const optOutWorkEmailLink = getServiceParams(req.loanAppInProgressActorId);
          todoWorkEmailClient.optOut(optOutWorkEmailLink, { body: {optedOutVerificationOption: req.body.reason}}, function(error, result) {
            if (error || !result) {
              const response = error.response;

              logger.error(response.data.errors, 'Error consuming optOutWorkEmail service. ' + response.statusText);
              return res.status(response.status).send({ error: 'Error consuming optOutWorkEmail service' });
            }

            return res.status(200).send(result.body);
          });
        }
      }
    ]
  });
};
