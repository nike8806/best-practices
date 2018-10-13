const sinon = require('sinon');
const { assert } = require('chai');
const proxyquire = require('proxyquire');
const fixtures = require('../../../../test-helper');

let mock;
const getPhoneVerificationStatusStub = sinon.stub();
const loggerErrorStub = sinon.stub();
const loggerInfoStub = sinon.stub();
const loggerWarnStub = sinon.stub();
const captureServiceErrorStub = sinon.stub();
const captureServiceErrorMock = { error: 'some Error' };

const ROUTE = {
  ACCOUNT: '/account/myAccount.action'
};
const errorServiceMock = {
  response: {
    data: {
      errors: 'some error'
    },
    statusText: 'error',
    status: 500
  }
};

describe('PHONE VERIFICATION Server', () => {
  before(() => {
    const server = proxyquire('../phone-verification-server', {
      'lc-app-config': {
        autoRoutes: {
          ACCOUNT: '/auto-routes-data'
        },
        'services.todoOrch.host': '/host-data'
      },
      'lc-service-client': function ClientStub() {
        return {
          getStatus: getPhoneVerificationStatusStub
        };
      },
      'lc-logger': {
        error: loggerErrorStub,
        info: loggerInfoStub,
        warn: loggerWarnStub
      },
      'service-error-handler': {
        captureServiceError: captureServiceErrorStub
      }
    });
    server({}, fixtures.register);
  });

  describe('GET todo/phone-verification/ URL', () => {
    beforeEach(() => {
      mock = fixtures.mock();
      mock.req.loanAppInProgress.borrowers = [
        {
          id: 174171827,
          primary: true
        }
      ];
      mock.req.params.urlType = 'phone-verification';
      loggerErrorStub.reset();
      loggerInfoStub.reset();
      loggerWarnStub.reset();
      captureServiceErrorStub.reset();
    });

    it('should render template if todo status is OPEN', () => {
      const expectedContext = {
        backUrl: '/account/myAccount.action',
        headerTitle: 'Confirm your application'
      };

      const result = { body: { status: 'OPEN' }, statusCode: 200 };
      getPhoneVerificationStatusStub.callsArgWith(1, null, result, result.body);
      fixtures.getMethodForRoute('/')(mock.req, mock.res);

      const expectedMsg = 'PHONE-VERIFICATION: rendering page';
      assert.isTrue(loggerInfoStub.calledOnce, 'Should log an info message');
      assert.isTrue(loggerInfoStub.calledWith(expectedMsg), 'Not expected params');

      assert.isTrue(mock.res.render.calledOnce, 'Render Was not called');
      assert.isTrue(
        mock.res.render.calledWith('phone-verification/phone-verification-template', expectedContext),
        'Render was not called with the expected context'
      );
    });

    it('should redirect if the status task is COMPLETED or not OPEN', () => {
      getPhoneVerificationStatusStub.callsArgWith(1, null, { body: { status: 'COMPLETE' }, statusCode: 200 });
      fixtures.getMethodForRoute('/')(mock.req, mock.res);

      const expectedMsg = `PHONE-VERIFICATION: not in OPEN status, redirecting to ${ROUTE.ACCOUNT}`;
      assert.isTrue(loggerWarnStub.calledOnce, 'Should log a warn message');
      assert.isTrue(loggerWarnStub.calledWith(expectedMsg), 'Not expected params');

      assert.isTrue(mock.res.redirect.calledOnce);
      assert.isTrue(mock.res.redirect.calledWith(302));
    });

    it('should render error template if the status task is NOT FOUND', () => {
      const result = { body: { errors: [{ code: 'TASK_NOT_FOUND' }] }, statusCode: 400 };
      getPhoneVerificationStatusStub.callsArgWith(1, null, result, result.body);
      captureServiceErrorStub.returns({ error: 'SomeError', statusCode: 400 });
      fixtures.getMethodForRoute('/')(mock.req, mock.res);
      const expectedMsg = 'PHONE-VERIFICATION: Task not found';
      assert.isTrue(loggerInfoStub.calledOnce, 'Should log an info message');
      assert.isTrue(loggerInfoStub.calledWith(expectedMsg), 'Not expected params');

      assert.isTrue(mock.res.render.calledOnce);
      assert.isTrue(mock.res.render.calledWith('error/error'));
    });

    it('should render error template if error is present in getStatus Service', () => {
      getPhoneVerificationStatusStub.callsArgWith(1, errorServiceMock);
      captureServiceErrorStub.returns(captureServiceErrorMock);
      fixtures.getMethodForRoute('/')(mock.req, mock.res);

      const expectedMsg = 'PHONE-VERIFICATION: Error consuming todoPhoneVerificationClient.getStatus service.';
      assert.isTrue(loggerErrorStub.calledOnce, 'Should log an error');
      assert.isTrue(loggerErrorStub.calledWith(
        { error: captureServiceErrorMock },
        expectedMsg
      ), 'Not expected params');

      assert.isTrue(mock.res.render.calledOnce);
      assert.isTrue(mock.res.render.calledWith('error/error'));
    });
  });

  describe('on GET todo/joint-phone-verification/ URL', () => {
    beforeEach(() => {
      mock = fixtures.mock();
      mock.req.loanAppInProgress.borrowers = [
        {
          id: 174171827,
          primary: true
        },
        {
          id: 174171828,
          primary: false
        }
      ];
      mock.req.params.urlType = 'joint-phone-verification';
      loggerErrorStub.reset();
      loggerInfoStub.reset();
      captureServiceErrorStub.reset();
    });

    it('should render template if todo status is OPEN', () => {
      const expectedContext = {
        backUrl: '/account/myAccount.action',
        headerTitle: 'Confirm your application'
      };
      const result = { body: { status: 'OPEN' }, statusCode: 200 };
      getPhoneVerificationStatusStub.callsArgWith(1, null, result, result.body);
      fixtures.getMethodForRoute('/')(mock.req, mock.res);

      const expectedMsg = 'JOINT-PHONE-VERIFICATION: rendering page';
      assert.isTrue(loggerInfoStub.calledOnce, 'Should log an info message');
      assert.isTrue(loggerInfoStub.calledWith(expectedMsg), 'Not expected params');

      assert.isTrue(mock.res.render.calledOnce, 'Render Was not called');
      assert.isTrue(
        mock.res.render.calledWith(
          'phone-verification/phone-verification-template',
          expectedContext
        ),
        'Render was not called with the expected context'
      );
    });

    it('should redirect if the status task is COMPLETED or not OPEN', () => {
      getPhoneVerificationStatusStub.callsArgWith(1, null, { body: { status: 'COMPLETE' }, statusCode: 200 });
      fixtures.getMethodForRoute('/')(mock.req, mock.res);

      const expectedMsg = `JOINT-PHONE-VERIFICATION: not in OPEN status, redirecting to ${ROUTE.ACCOUNT}`;
      assert.isTrue(loggerWarnStub.calledOnce, 'Should log a warn message');
      assert.isTrue(loggerWarnStub.calledWith(expectedMsg), 'Not expected params');

      assert.isTrue(mock.res.redirect.calledOnce);
      assert.isTrue(mock.res.redirect.calledWith(302));
    });

    it('should render error template if the status task is NOT FOUND', () => {
      const result = { body: { errors: [{ code: 'TASK_NOT_FOUND' }] }, statusCode: 400 };
      getPhoneVerificationStatusStub.callsArgWith(1, null, result, result.body);
      captureServiceErrorStub.returns({ error: 'SomeError', statusCode: 400 });
      fixtures.getMethodForRoute('/')(mock.req, mock.res);

      const expectedMsg = 'JOINT-PHONE-VERIFICATION: Task not found';
      assert.isTrue(loggerInfoStub.calledOnce, 'Should log an info message');
      assert.isTrue(loggerInfoStub.calledWith(expectedMsg), 'Not expected params');

      assert.isTrue(mock.res.render.calledOnce);
      assert.isTrue(mock.res.render.calledWith('error/error'));
    });

    it('should render error template if error is present in getStatus Service', () => {
      getPhoneVerificationStatusStub.callsArgWith(1, errorServiceMock);
      captureServiceErrorStub.returns(captureServiceErrorMock);
      fixtures.getMethodForRoute('/')(mock.req, mock.res);

      const expectedMsg = 'JOINT-PHONE-VERIFICATION: Error consuming todoPhoneVerificationClient.getStatus service.';
      assert.isTrue(loggerErrorStub.calledOnce, 'Should log an error');
      assert.isTrue(loggerErrorStub.calledWith(
        { error: captureServiceErrorMock },
        expectedMsg
      ), 'Not expected params');

      assert.isTrue(mock.res.render.calledOnce);
      assert.isTrue(mock.res.render.calledWith('error/error'));
    });

    it('should render error if a NOT JOINT user try to access to the page', () => {
      mock.req.loanAppInProgress.borrowers = [
        {
          id: 174171827,
          primary: true
        }
      ];
      fixtures.getMethodForRoute('/')(mock.req, mock.res);

      const expectedMsg = 'JOINT-PHONE-VERIFICATION: Secondary borrower was not found';
      assert.isTrue(loggerErrorStub.calledOnce, 'Should log an error');
      assert.isTrue(loggerErrorStub.calledWith(expectedMsg), 'Not expected params');

      assert.isTrue(mock.res.render.calledOnce, 'Should call a render function');
      assert.isTrue(mock.res.render.calledWith('error/error'));
    });
  });
});
