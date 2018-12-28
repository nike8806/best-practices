
const { assert } = require('chai');
const sinon = require('sinon');
const proxyquire = require('proxyquire');
const fixtures = require('../../../../test-helper');

let mock;
const submitClientStub = sinon.stub();
const optOutClientStub = sinon.stub();
const getStatusClientStub = sinon.stub();
const loggerErrorStub = sinon.stub();
const loggerInfoStub = sinon.stub();
const loggerWarnStub = sinon.stub();
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

describe('Work Email Confirmation Server', () => {
  let statusResponseMock;
  before(() => {
    const server = proxyquire('../work-email-confirmation-server.js', {
      'lc-app-config': {
        autoRoutes: { ACCOUNT: '/sfasdasd' },
        'services.todoOrch.host': '/sdfsdfadsf',
        'services.todoOrch.resendEmailPath': '/fskjdfasdf',
        'services.todoOrch.statusWorkEmailPath': '/status'
      },
      'lc-service-client': function ClientStub() {
        return {
          getStatus: getStatusClientStub,
          submitWorkEmail: submitClientStub,
          optOut: optOutClientStub
        };
      },
      'lc-logger': {
        error: loggerErrorStub,
        info: loggerInfoStub,
        warn: loggerWarnStub
      }
    });

    server({}, fixtures.register);
  });

  beforeEach(() => {
    mock = fixtures.mock();
  });

  describe('get method', () => {
    beforeEach(() => {
      statusResponseMock = { body: { status: 'OPEN' }, statusCode: 200 };
      mock = fixtures.mock();
    });

    it('should render template if we have a success response', () => {
      const expectedContext = {
        backUrl: '/account/myAccount.action',
        headerTitle: 'Confirm Your Employment'
      };
      getStatusClientStub.callsArgWith(1, null, statusResponseMock);
      fixtures.getMethodForRoute('/')(mock.req, mock.res);

      assert.isTrue(mock.res.render.calledOnce);
      assert.isTrue(
        mock.res.render.calledWith('work-email-confirmation/work-email-confirmation-template'),
        expectedContext, 'Error with the context'
      );
    });

    it('should render error template if todoList is empty', () => {
      statusResponseMock.body = null;
      getStatusClientStub.callsArgWith(1, null, statusResponseMock);
      fixtures.getMethodForRoute('/')(mock.req, mock.res);
      assert.isTrue(mock.res.redirect.calledOnce);
      assert.isTrue(mock.res.redirect.calledWith(302), 'Was not redirected');
    });

    it('should render error template and log error if error is present', () => {
      loggerErrorStub.reset();
      getStatusClientStub.callsArgWith(1, errorServiceMock, null);
      fixtures.getMethodForRoute('/')(mock.req, mock.res);

      assert.isTrue(loggerErrorStub.calledOnce);
      assert.isTrue(mock.res.render.calledOnce);
      assert.isTrue(mock.res.render.calledWith('error/error'));
    });

    it('should render error template and log warn if task not found is present', () => {
      loggerWarnStub.reset();
      getStatusClientStub.callsArgWith(1, {
        code: 'TASK_NOT_FOUND'
      }, null);
      fixtures.getMethodForRoute('/')(mock.req, mock.res);

      assert.isTrue(loggerWarnStub.calledOnce);
      assert.isTrue(mock.res.render.calledOnce);
      assert.isTrue(mock.res.render.calledWith('error/error'));
    });
  });

  describe('/send path', () => {
    beforeEach(() => {
      statusResponseMock = { body: { email: 'email@sadas.com' }, statusCode: 200 };
    });

    it('should require a work email', () => {
      mock.req.body.email = null;

      fixtures.getMethodForRoute('/send')(mock.req, mock.res);

      assert(mock.res.status.calledWith(400));
      assert(mock.res.json.calledOnce);
    });

    describe('with required data', () => {
      beforeEach(() => {
        mock = fixtures.mock();
        Object.assign(mock.req, {
          body: {
            email: 'some@email.tld'
          },
          user: {
            getTodo() {
              return {
                links: {
                  send: '/work_email_verification/lists/LISTGUID/tasks/TASKGUID/submit?extId=EXTERNALID'
                }
              };
            }
          }
        });
      });

      it('should return a statusCode 200 on success service response', () => {
        submitClientStub.reset();
        submitClientStub.callsArgWith(2, null, statusResponseMock);
        fixtures.getMethodForRoute('/send')(mock.req, mock.res);

        assert.isTrue(mock.res.status.calledWith(200), 'Was not called with 200');
        assert.isTrue(mock.res.json.calledWith(statusResponseMock.body), 'Error params');
      });

      it('should return a statusCode 500 when the service fails', () => {
        submitClientStub.reset();
        submitClientStub.callsArgWith(2, null, errorServiceMock);
        fixtures.getMethodForRoute('/send')(mock.req, mock.res);

        assert.isTrue(mock.res.status.calledWith(500));
        assert.isTrue(mock.res.json.calledOnce, 'send was not called');
        assert.isTrue(mock.res.json.calledWith({ error: 'Error consuming submitWorkEmail service' }), 'The send param must be { error: "Error consuming submitWorkEmail service" }');
      });

      it('should return an error state when service fails', () => {
        submitClientStub.reset();
        submitClientStub.callsArgWith(2, errorServiceMock);
        fixtures.getMethodForRoute('/send')(mock.req, mock.res);

        assert.isTrue(mock.res.status.calledWith(500));
        assert.isTrue(mock.res.json.calledOnce);
      });
    });
  });

  describe('/optout path', () => {
    beforeEach(() => {
      statusResponseMock = { body: { success: true }, statusCode: 200 };
    });
    it('should require optout reason', () => {
      mock.req.body.reason = null;
      fixtures.getMethodForRoute('/optout')(mock.req, mock.res);

      assert.isTrue(mock.res.status.calledWith(400));
      assert.isTrue(mock.res.json.calledOnce);
    });

    describe('with required data', () => {
      const goodReason = 'a very good reason';

      it('should return a success state with a success service response', () => {
        mock.req.body.reason = goodReason;
        optOutClientStub.reset();
        optOutClientStub.callsArgWith(2, null, statusResponseMock);
        fixtures.getMethodForRoute('/optout')(mock.req, mock.res);

        assert.isTrue(mock.res.status.calledWith(200));
        assert.isTrue(mock.res.json.calledWith(statusResponseMock.body));
      });

      it('should return an error state when service fails', () => {
        mock.req.body.reason = goodReason;
        optOutClientStub.reset();
        optOutClientStub.callsArgWith(2, errorServiceMock);
        fixtures.getMethodForRoute('/optout')(mock.req, mock.res);

        assert.isTrue(mock.res.status.calledWith(500));
        assert.isTrue(mock.res.json.calledOnce);
      });
    });
  });
});
