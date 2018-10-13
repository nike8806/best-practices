const sinon = require('sinon');
const { assert } = require('chai');
const proxyquire = require('proxyquire');
const fixtures = require('../../../../test-helper');

let mock;
const getStatusStub = sinon.stub();
const optinStub = sinon.stub();
const optoutStub = sinon.stub();
const loggerErrorStub = sinon.stub();

const plaidConfig = {
  clientName: 'LendingClub',
  product: ['transactions'],
  selectAccount: true,
  env: 'sandbox',
  key: 'key123',
  apiVersion: 'v2'
};

const plaidData = {
  plaidAgreementType: 'AgreementName',
  plaidAgreementVersion: 3,
  institutionName: 'chase',
  hasPlaidData: true,
  logo: 'logo1234567890'
};

const bankAgreement = {
  type: 'AgreementName',
  version: '3'
};

const getLatestAgreementsStub = sinon.stub();
const getAgreementLinksStub = sinon.stub().callsFake(() => ({
  BorrowerBankLinkAuth: bankAgreement
}));

const prepareContextStub = sinon.stub();
const getPlaidEnvConfigStub = sinon.stub().callsFake(() => ({
  plaidEnv: plaidConfig.env,
  plaidPublicKey: plaidConfig.key
}));

const optinRequestBody = {
  plaidAgreementType: 'AgreementName',
  plaidAgreementVersion: 3,
  public_token: 'token1234',
  account_id: 'account-id-7890'
};

const responseMock = {
  body: {
    status: 'OPEN'
  },
  statusCode: 200
};

const errorResponseMock = {
  body: {
    errors: [{}]
  },
  statusCode: 200
};

describe('Income Verification Server', () => {
  before(() => {
    const server = proxyquire('../income-verification-server', {
      'lc-app-config': {
        autoRoutes: {
          ACCOUNT: '/auto-routes-data'
        },
        'services.todoOrch.host': '/host-data'
      },
      'lc-service-client': function ClientStub() {
        return {
          getStatus: getStatusStub,
          optin: optinStub,
          optout: optoutStub
        };
      },
      'lc-logger': {
        error: loggerErrorStub,
        info: sinon.stub()
      },
      plaid: {
        utils: {
          getPlaidEnvConfig: getPlaidEnvConfigStub
        },
        api: {
          prepareContext: prepareContextStub
        }
      },
      'pbs-client': {
        getLatestAgreements: getLatestAgreementsStub
      },
      'agreement-links': {
        getAgreementLinks: getAgreementLinksStub
      }
    });

    server({}, fixtures.register);
  });

  describe('get method', () => {
    beforeEach(() => {
      mock = fixtures.mock();
      mock.req.product = {
        ids: ['id123'],
        name: 'AgreementName'
      };
    });

    it('should render template if todo status is OPEN and the get service returns a 200 response', () => {
      const expectedContext = {
        backUrl: '/account/myAccount.action',
        headerTitle: 'Verify your income',
        plaidConfig: JSON.stringify(plaidConfig),
        plaidData: JSON.stringify({
          plaidAgreementType: 'AgreementName',
          plaidAgreementVersion: 3,
          institutionName: 'chase',
          hasPlaidData: true,
          institutionLogo: 'logo1234567890'
        })
      };
      getStatusStub.callsArgWith(1, null, responseMock);
      getLatestAgreementsStub.callsArgWith(1, null, { agreement: 'BorroweBankLinkAuth' });
      prepareContextStub.callsArgWith(1, null, plaidData);

      fixtures.getMethodForRoute('/')(mock.req, mock.res);

      assert.isTrue(mock.res.render.calledOnce);
      assert.isTrue(mock.res.render.calledWith('income-verification/income-verification-template', expectedContext));
    });

    it('should redirect if todo item is not OPEN', () => {
      getStatusStub.callsArgWith(1, null, { body: { status: 'COMPLETED' }, statusCode: 200 });
      fixtures.getMethodForRoute('/')(mock.req, mock.res);

      assert.isTrue(mock.res.redirect.calledOnce);
      assert.isTrue(mock.res.redirect.calledWith(302));
    });

    it('should redirect if todo item returns an error with code TASK_NOT_FOUND', () => {
      getStatusStub.callsArgWith(1, null, { body: { errors: [{ code: 'TASK_NOT_FOUND' }] }, statusCode: 200 });
      fixtures.getMethodForRoute('/')(mock.req, mock.res);

      assert.isTrue(mock.res.redirect.calledOnce);
      assert.isTrue(mock.res.redirect.calledWith(302));
    });

    it('should render error template if error is present in get status Service', () => {
      getStatusStub.callsArgWith(1, {
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

    it('should render error template if error is present in pbs agreements Service', () => {
      getStatusStub.callsArgWith(1, null, responseMock);
      getLatestAgreementsStub.callsArgWith(1, {
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

    it('should log error if error is present in get Plaid data Service', () => {
      getStatusStub.callsArgWith(1, null, responseMock);
      getLatestAgreementsStub.callsArgWith(1, null, { agreement: 'BorroweBankLinkAuth' });
      const errorObj = {
        error: 'some error'
      };
      prepareContextStub.reset();
      prepareContextStub.callsArgWith(1, errorObj);
      fixtures.getMethodForRoute('/')(mock.req, mock.res);

      assert.isTrue(loggerErrorStub.called);
      assert.isTrue(loggerErrorStub.calledWith(errorObj, 'INCOME-VERIFICATION: Error getting plaidData'));
    });
  });

  describe('/optin route', () => {
    beforeEach(() => {
      mock = fixtures.mock();
      mock.req.body = optinRequestBody;
    });

    it('should return a success state when the get status service and the optin service return a success response', () => {
      optinStub.reset();
      const response = { body: { status: 'SUBMITTED' }, statusCode: 200 };
      optinStub.callsArgWith(2, null, response, response.body);

      fixtures.getMethodForRoute('/optin')(mock.req, mock.res);

      assert.isTrue(mock.res.status.calledWith(200));
      assert.isTrue(mock.res.json.calledWith(response.body));
    });

    it('should return an error when the optin service returns an error response', () => {
      optinStub.reset();
      const response = { body: {}, statusCode: 404 };
      optinStub.callsArgWith(2, null, response, response.body);

      fixtures.getMethodForRoute('/optin')(mock.req, mock.res);

      assert.isTrue(mock.res.status.calledWith(404));
      assert.isTrue(mock.res.json.calledOnce);
      assert.isTrue(mock.res.json.calledWith({ error: 'Error consuming Optin service' }));
    });

    it('should return an error when the optin service returns an error response but it is received as a 200 response', () => {
      optinStub.reset();
      const response = errorResponseMock;
      optinStub.callsArgWith(2, null, response, response.body);

      fixtures.getMethodForRoute('/optin')(mock.req, mock.res);

      assert.isTrue(mock.res.status.calledWith(500));
      assert.isTrue(mock.res.json.calledOnce);
      assert.isTrue(mock.res.json.calledWith({ error: 'Error consuming Optin service' }));
    });
  });

  describe('/optout route', () => {
    beforeEach(() => {
      mock = fixtures.mock();
    });

    it('should return a success state when the get status service and the optout service return a success response', () => {
      optoutStub.reset();
      const response = { body: { status: 'SUBMITTED' }, statusCode: 200 };
      optoutStub.callsArgWith(1, null, response, response.body);

      fixtures.getMethodForRoute('/optout')(mock.req, mock.res);

      assert.isTrue(mock.res.status.calledWith(200));
      assert.isTrue(mock.res.json.calledWith(response.body));
    });

    it('should return an error when the optout service returns an error response', () => {
      optoutStub.reset();
      const response = { body: {}, statusCode: 404 };
      optoutStub.callsArgWith(1, null, response, response.body);

      fixtures.getMethodForRoute('/optout')(mock.req, mock.res);

      assert.isTrue(mock.res.status.calledWith(404));
      assert.isTrue(mock.res.json.calledOnce);
      assert.isTrue(mock.res.json.calledWith({ error: 'Error consuming Optout service' }));
    });

    it('should return an error when the optout service returns an error response but it is received as a 200 response', () => {
      optoutStub.reset();
      const response = errorResponseMock;
      optoutStub.callsArgWith(1, null, response, response.body);

      fixtures.getMethodForRoute('/optout')(mock.req, mock.res);

      assert.isTrue(mock.res.status.calledWith(500));
      assert.isTrue(mock.res.json.calledOnce);
      assert.isTrue(mock.res.json.calledWith({ error: 'Error consuming Optout service' }));
    });
  });
});
