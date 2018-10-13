const Client = require('lc-service-client');
const logger = require('lc-logger');
const config = require('lc-app-config');
const ROUTE = config.get('autoRoutes');
const errorHandler = require('service-error-handler');

/**
 * Client for KBA services.
 */
const todoKBAClient = new Client('PL-TODO-ORCH KBA', {
  getStatus: {
    url: config.get('services.todoOrch.host') + config.get('services.todoOrch.kbaGetStatusPath'),
    method: 'GET'
  },
  getQuestions: {
    url: config.get('services.todoOrch.host') + config.get('services.todoOrch.kbaGetQuestionsPath'),
    method: 'GET'
  },
  postAnswers: {
    url: config.get('services.todoOrch.host') + config.get('services.todoOrch.kbaAnswersPath'),
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
    path: '/kba',
    middleware: ['authorize', 'get-loan-apps', 'get-loan-app-in-progress'],
    action: [
      {
        path: '/',
        middleware: ['navigation-bar-context'],
        get(req, res) {
          const serviceParams = getServiceParams(req.loanAppInProgressActorId);
          todoKBAClient.getStatus(serviceParams, (errorStatus, resultStatus, bodyStatus) => {
            const serviceStatusError = errorHandler.captureServiceError(errorStatus, resultStatus, bodyStatus);
            if (serviceStatusError) {
              logger.error({error: serviceStatusError}, 'KBA: Error consuming getStatus service.');
              return res.render('error/error', {});
            }

            const kba = resultStatus.body;
            const kbaStatus = kba && kba.status;
            if (kbaStatus !== 'OPEN' && kbaStatus !== 'SUBMITTED') {
              logger.info('KBA: not in OPEN status, redirecting to ' + ROUTE.ACCOUNT);
              return res.redirect(302, ROUTE.ACCOUNT);
            }

            const context = Object.assign({}, req.navigationBarContext, {
              headerTitle: 'Verify your identity'
            });

            return res.render('kba/kba-template', context);
          });
        }
      },
      {
        path: '/questions',
        get(req, res) {
          const serviceParams = getServiceParams(req.loanAppInProgressActorId);
          todoKBAClient.getQuestions(serviceParams, (error, result, body) => {
            const serviceError = errorHandler.captureServiceError(error, result, body);
            if (serviceError) {
              const statusCode = (serviceError.statusCode === 200) ? 500 : serviceError.statusCode;
              logger.error({error: serviceError}, 'KBA: Error consuming getQuestions service.');
              return res.status(statusCode).json({ error: 'Error consuming getQuestions service' });
            }

            const response = result.body;
            response.questions = (response.questions && response.questions.question) || [];
            return res.status(result.statusCode).json(response);
          });
        }
      },
      {
        path: '/answers',
        post(req, res) {
          const serviceParams = getServiceParams(req.loanAppInProgressActorId);
          todoKBAClient.postAnswers(serviceParams, { body: req.body }, (error, result, body) => {
            const serviceError = errorHandler.captureServiceError(error, result, body);
            const {body: bodyResponse} = result || {};
            const isKbaFailed = (bodyResponse && bodyResponse.status === true && bodyResponse.message === 'FAILED');
            const hasWrongAnswers = (
              bodyResponse
              && bodyResponse.errors
              && bodyResponse.errors.length
              && (bodyResponse.errors[0].code === 'KBA_INVALID_ANSWERS' ||
                bodyResponse.errors[0].code === 'KBA_TECHNICAL_ERROR')
            );

            if (serviceError && !isKbaFailed && !hasWrongAnswers) {
              logger.error({error: serviceError}, 'KBA: Error consuming submit answers service.');
              const statusCode = (serviceError.statusCode === 200) ? 500 : serviceError.statusCode;
              return res.status(statusCode).json({
                error: 'KBA: Error consuming submit answers service.'
              });
            }

            if (bodyResponse.message === 'SUCCESS') {
              const fourthQuestion = bodyResponse.questions && bodyResponse.questions.question || undefined;
              let response = (fourthQuestion) ? {state: 'PENDING', questions: fourthQuestion} : {state: 'DONE'};

              logger.info('KBA: Success Status');
              return res.status(200).json(response);
            }

            if (isKbaFailed || hasWrongAnswers) {
              logger.info('KBA: Completed Status');
              return res.status(200).json({state: 'COMPLETED'});
            }

            logger.error({error: bodyResponse}, 'KBA: Error consuming submit answers service.');
            // Other invalid case server error
            return res.status(500).json({
              error: 'unexpected server error'
            });

          });
        }
      }
    ]
  });
};
