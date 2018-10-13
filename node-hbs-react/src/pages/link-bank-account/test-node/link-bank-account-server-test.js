
const sinon = require('sinon');
const { assert } = require('chai');
const proxyquire = require('proxyquire');
const fixtures = require('../../../../test-helper');

let mock;
const getLinkBankAccountStatusStub = sinon.stub();
const submitLinkBankAccountStub = sinon.stub();
const loggerErrorStub = sinon.stub();

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

describe('LINK BANK ACCOUNT Server', () => {
  before(() => {
    const server = proxyquire('../link-bank-account-server', {
      'lc-app-config': {
        autoRoutes: {
          ACCOUNT: '/auto-routes-data'
        },
        'services.todoOrch.host': '/host-data'
      },
      'lc-service-client': function ClientStub() {
        return {
          getStatus: getLinkBankAccountStatusStub,
          postSubmit: submitLinkBankAccountStub
        };
      },
      'lc-logger': {
        error: loggerErrorStub,
        info: sinon.stub()
      }
    });
    server({}, fixtures.register);
  });

  describe('GET todo/link-bank-account/ URL', () => {
    beforeEach(() => {
      mock = fixtures.mock();
    });

    it('should render template if todo status is OPEN and a response 200', () => {
      const expectedContext = {
        backUrl: '/account/myAccount.action',
        headerTitle: 'Link your bank account'
      };

      getLinkBankAccountStatusStub.callsArgWith(1, null, { body: { status: 'OPEN' }, statusCode: 200 });
      fixtures.getMethodForRoute('/')(mock.req, mock.res);
      assert.isTrue(mock.res.render.calledOnce, 'Render Was not called');
      assert.isTrue(mock.res.render.calledWith('link-bank-account/link-bank-account-template', expectedContext), 'Render was not called with the expected context');
    });

    it('should redirect if the status task is not OPEN', () => {
      getLinkBankAccountStatusStub.callsArgWith(1, null, { body: { status: 'COMPLETE' }, statusCode: 200 });
      fixtures.getMethodForRoute('/')(mock.req, mock.res);
      assert.isTrue(mock.res.redirect.calledOnce);
      assert.isTrue(mock.res.redirect.calledWith(302));
    });

    it('should render error template if error is present in getStatus Service', () => {
      getLinkBankAccountStatusStub.callsArgWith(1, errorServiceMock);
      fixtures.getMethodForRoute('/')(mock.req, mock.res);
      assert.isTrue(mock.res.render.calledOnce);
      assert.isTrue(mock.res.render.calledWith('error/error'));
    });
  });

  describe('/submit route', () => {
    let submitResponseMock;
    const errorResponseMock = {
      statusCode: 400,
      body: {
        errors: [{
          field: null,
          code: 'input',
          message: 'MISSING_PRIMARY_ACCT_HOLDER_FIRSTNAME',
          recoverability: null
        },
        {
          field: null,
          code: 'input',
          message: 'INVALID_BANK_ACCOUNT_NUMBER',
          recoverability: null
        }
        ]
      }
    };

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

    beforeEach(() => {
      mock = fixtures.mock();
      submitResponseMock = { body: { status: 'COMPLETE' }, statusCode: 200 };
      submitLinkBankAccountStub.reset();
    });

    it('should return a success state with a success service response', () => {
      submitLinkBankAccountStub.callsArgWith(2, null, submitResponseMock);
      fixtures.getMethodForRoute('/submit')(mock.req, mock.res);
      assert.isTrue(mock.res.status.calledWith(200));
      assert.isTrue(mock.res.json.calledWith(submitResponseMock.body));
    });

    it('should return an error state when missing parameters', () => {
      submitLinkBankAccountStub.callsArgWith(2, null, errorResponseMock, errorResponseMock.body);
      fixtures.getMethodForRoute('/submit')(mock.req, mock.res);
      assert.isTrue(mock.res.status.calledWith(errorResponseMock.statusCode), 'wrong status');
      assert.isTrue(mock.res.json.calledOnce, 'Was not called once');
      const errorResponse = {
        errors: [{
          errorCode: 'MISSING_PRIMARY_ACCT_HOLDER_FIRSTNAME',
          error: POST_SUBMIT_ERRORS.MISSING_PRIMARY_ACCT_HOLDER_FIRSTNAME
        },
        {
          errorCode: 'INVALID_BANK_ACCOUNT_NUMBER',
          error: POST_SUBMIT_ERRORS.INVALID_BANK_ACCOUNT_NUMBER
        }
        ]
      };
      assert.isTrue(mock.res.json.calledWith(errorResponse), 'Was not called with the correct params');
    });

    Object.keys(POST_SUBMIT_ERRORS).forEach((keyError) => {
      it(`should return a response with statusCode 400 when the status is of ${keyError}`, () => {
        const submitErrorResponseMock = {
          statusCode: 400,
          body: {
            errors: [{
              field: null,
              code: keyError === 'UNKNOWN_ERROR' ? 'UNKNOWN_ERROR' : 'input',
              message: keyError,
              recoverability: null
            }]
          }
        };
        submitLinkBankAccountStub
          .callsArgWith(2, null, submitErrorResponseMock, submitErrorResponseMock.body);
        fixtures.getMethodForRoute('/submit')(mock.req, mock.res);
        assert.isTrue(mock.res.status.calledWith(submitErrorResponseMock.statusCode), 'wrong status');
        assert.isTrue(mock.res.json.calledOnce, 'Was not called once');
        const errorResponse = {
          errors: [{
            errorCode: keyError,
            error: POST_SUBMIT_ERRORS[keyError]
          }]
        };
        assert.isTrue(mock.res.json.calledWith(errorResponse), 'Was not called with the correct params');
      });
    });
  });
});
