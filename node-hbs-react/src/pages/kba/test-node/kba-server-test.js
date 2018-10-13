'use strict';
const sinon = require('sinon');
const assert = require('chai').assert;
const proxyquire = require('proxyquire');
const fixtures = require('../../../../test-helper');
const mockAnwsersAllGood = require('../mockAnwsersAllGood');
const mockAnswersFourthQuestion = require('../mockAnswersFourthQuestion');
const mockAnwsersFail = require('../mockAnwsersFail');
const mockAnwsersKbaWrongAnswers = require('../mockAnwsersKbaWrongAnswers');


let mock;
let clientStub = sinon.stub();
let clientQuestionsStub = sinon.stub();
let loggerErrorStub = sinon.stub();
let clientAnswersStub = sinon.stub();
const errorServiceMock = {
  errors: [
    {
      field: null,
      code: 'UNKNOWN_ERROR',
      message: 'unexpected server error',
      recoverability: 'Not Recoverable'
    }
  ]
};

describe('KBA Server', () => {
  let statusResponseMock;
  before(() => {
    const server = proxyquire('../kba-server', {
      'lc-app-config': {
        'autoRoutes': {ACCOUNT: '/sfasdasd'},
        'services.todoOrch.host': '/sdfsdfadsf'
      },
      'lc-service-client': function ClientStub() {
        return {
          getStatus: clientStub,
          getQuestions: clientQuestionsStub,
          postAnswers: clientAnswersStub
        };
      },
      'lc-logger': {
        error: loggerErrorStub,
        info: sinon.stub()
      }
    });

    server({}, fixtures.register);
  });

  beforeEach(() => {
    statusResponseMock = { body: { status: 'OPEN', questions: {} }, statusCode: 200 };
    mock = fixtures.mock();
  });

  describe('get method', () => {
    beforeEach(() => {
      mock = fixtures.mock();
    });

    it('should render template if todo item is OPEN', () => {
      const expectedContext = {
        backUrl: '/account/myAccount.action',
        headerTitle: 'Verify your identity'
      };
      clientStub.callsArgWith(1, null, statusResponseMock);

      fixtures.getMethodForRoute('/')(mock.req, mock.res);

      assert.isTrue(mock.res.render.calledOnce);
      assert.isTrue(mock.res.render.calledWith('kba/kba-template', expectedContext));
    });

    it('should render template if todo item is SUBMITTED', () => {
      statusResponseMock.body.status = 'SUBMITTED';
      const expectedContext = {
        backUrl: '/account/myAccount.action',
        headerTitle: 'Verify your identity'
      };
      clientStub.callsArgWith(1, null, statusResponseMock);

      fixtures.getMethodForRoute('/')(mock.req, mock.res);

      assert.isTrue(mock.res.render.calledOnce);
      assert.isTrue(mock.res.render.calledWith('kba/kba-template', expectedContext));
    });

    it('should redirect if todo item is not OPEN or SUBMITTED', () => {
      statusResponseMock.body.status = 'COMPLETED';
      clientStub.callsArgWith(1, null, statusResponseMock);
      fixtures.getMethodForRoute('/')(mock.req, mock.res);

      assert.isTrue(mock.res.redirect.calledOnce);
      assert.isTrue(mock.res.redirect.calledWith(302));
    });

    it('should render error template if error is present', () => {
      clientStub.callsArgWith(1, {
        response: {
          data: {
            errors: 'some error'
          },
          statusText: 'error',
          status: 500
        }
      });
      fixtures.getMethodForRoute('/')(mock.req, mock.res);

      assert.isTrue(mock.res.render.calledOnce);
      assert.isTrue(mock.res.render.calledWith('error/error'));
    });
  });

  describe('get questions method', () => {
    it('should return status 200 when service response is successful', () => {
      mock = fixtures.mock();

      clientQuestionsStub.callsArgWith(1, null, statusResponseMock);

      fixtures.getMethodForRoute('/questions')(mock.req, mock.res);

      assert.isTrue(mock.res.status.calledWith(200));
      assert.isTrue(mock.res.json.calledOnce);
    });

    it('should return error when questions service fails', () => {
      mock = fixtures.mock();

      clientQuestionsStub.callsArgWith(1, errorServiceMock, null);

      fixtures.getMethodForRoute('/questions')(mock.req, mock.res);
      assert.isTrue(mock.res.status.calledWith(500), 'Wrong status');
      assert.isTrue(mock.res.json.calledWith({ error: 'Error consuming getQuestions service' }), 'Res json was not called correctly');
    });

    it('should log service error when questions service response statusCode is not 200', () => {
      mock = fixtures.mock();
      clientQuestionsStub.callsArgWith(1, null, errorServiceMock );
      fixtures.getMethodForRoute('/questions')(mock.req, mock.res);
      assert.isTrue(mock.res.status.calledWith(500), 'Wrong status');
      assert.isTrue(mock.res.json.calledWith({ error: 'Error consuming getQuestions service' }), 'Wrong response');
    });
  });

  describe('post answers method', () => {
    beforeEach(() => {
      mock = fixtures.mock();
      mock.req.body = {
        idquestionnaireAnswers: {
          idNumber: 1970356059,
          question1Answer: 'ATLANTA',
          question1Type: 'city.of.residence',
          question2Answer: 'None of the above',
          question2Type: 'purchased.property.from',
          question3Answer: 'None of the above',
          question3Type: 'alternate.names.phone'
        },
        loanId: 144339378
      };
    });

    describe('Should return a response with statusCode 200', () => {
      it('when all the answers were correct', () => {
        clientAnswersStub.reset();
        clientAnswersStub.callsArgWith(2, null, { body: mockAnwsersAllGood, 'statusCode': 200 });
        fixtures.getMethodForRoute('/answers')(mock.req, mock.res);
        assert.isTrue(clientAnswersStub.calledOnce, 'Service was not called');
        assert.isTrue(mock.res.status.calledOnce, 'Was not called with the correct status');
        assert.isTrue(mock.res.status.calledWith(200), 'Wrong status');
        assert.isTrue(mock.res.json.calledWithMatch({state: 'DONE'}), 'Incorrect response');
      });
      it('with status PENDING when the answer has one error, (FourthQuestion)', () => {
        clientAnswersStub.reset();
        clientAnswersStub.callsArgWith(2, null, { body: mockAnswersFourthQuestion, statusCode: 200 });
        fixtures.getMethodForRoute('/answers')(mock.req, mock.res);
        assert.isTrue(clientAnswersStub.calledOnce, 'Service was not called');
        assert.isTrue(mock.res.status.calledOnce, 'Was not called with the correct status');
        assert.isTrue(mock.res.status.calledWith(200), 'Wrong status');
        assert.isTrue(mock.res.json.calledWithMatch({state: 'PENDING', questions: mockAnswersFourthQuestion.questions.question }), 'Incorrect response');
      });

      it('with status COMPLETED if answers were wrong CASE 1', () => {
        clientAnswersStub.reset();
        clientAnswersStub.callsArgWith(2, null, { body: mockAnwsersFail, statusCode: 400 });
        mock = fixtures.mock();
        fixtures.getMethodForRoute('/answers')(mock.req, mock.res);
        assert.isTrue(mock.res.status.calledOnce);
        assert.isTrue(mock.res.status.calledWith(200), 'Wrong status');
        assert.isTrue(mock.res.json.calledWithMatch({state: 'COMPLETED'}), 'Incorrect response');
      });

      it('with status COMPLETED if answers were wrong CASE 2', () => {
        clientAnswersStub.reset();
        clientAnswersStub.callsArgWith(2, null, { body: mockAnwsersKbaWrongAnswers, statusCode: 400 });
        mock = fixtures.mock();
        fixtures.getMethodForRoute('/answers')(mock.req, mock.res);
        assert.isTrue(mock.res.status.calledOnce);
        assert.isTrue(mock.res.status.calledWith(200), 'Wrong status');
        assert.isTrue(mock.res.json.calledWithMatch({state: 'COMPLETED'}), 'Incorrect response');
      });
    });

    describe('Should return an error response', () => {
      it('if the service returns an error', () => {
        clientAnswersStub.reset();
        clientAnswersStub.callsArgWith(2, errorServiceMock);

        mock = fixtures.mock();
        fixtures.getMethodForRoute('/answers')(mock.req, mock.res);

        assert.isTrue(mock.res.status.calledOnce);
        assert.isTrue(mock.res.status.calledWith(500), 'Wrong status');
        assert.isTrue(mock.res.json.calledWithMatch({ error: 'KBA: Error consuming submit answers service.' }));
      });

      it('if the KBA service returns technical error', () => {
        const kbaTechnicalErrorMock = {
          errors: [
            {
              field: null,
              code: 'KBA_TECHNICAL_ERROR',
              message: 'KBA technical error',
              recoverability: 'Not Recoverable'
            }
          ]
        };
        clientAnswersStub.reset();
        clientAnswersStub.callsArgWith(2, null, kbaTechnicalErrorMock);

        mock = fixtures.mock();
        fixtures.getMethodForRoute('/answers')(mock.req, mock.res);

        assert.isTrue(mock.res.status.calledOnce);
        assert.isTrue(mock.res.status.calledWith(500), 'Wrong status');
        assert.isTrue(mock.res.json.calledWithMatch({ error: 'KBA: Error consuming submit answers service.' }));
      });
    });
  });
});
