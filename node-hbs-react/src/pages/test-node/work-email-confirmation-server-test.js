
'use strict';

const assert = require('chai').assert;
const sinon = require('sinon');
const proxyquire = require('proxyquire');
const fixtures = require('../../../../test-helper');

let mock;
const submitClientStub = sinon.stub();
const optOutClientStub = sinon.stub();
const getStatusClientStub = sinon.stub();

describe('Work Email Confirmation Server', () => {
  before(() => {
    const server = proxyquire('../work-email-confirmation-server.js', {
      'lc-app-config': {
        'autoRoutes': {ACCOUNT: '/sfasdasd'},
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
      }
    });

    server({}, fixtures.register);
  });

  beforeEach(() => {
    mock = fixtures.mock();
  });

  describe('get method', () => {
    beforeEach(() => {
      mock = fixtures.mock();
    });

    it('should render template if data is ok', () => {
      const expectedContext = {
        backUrl: '/account/myAccount.action',
        headerTitle: 'Confirm Your Employment'
      };

      getStatusClientStub.callsArgWith(1, null, { body: { 'status': 'OPEN' } });
      fixtures.getMethodForRoute('/')(mock.req, mock.res);

      assert.isTrue(mock.res.render.calledOnce);
      assert.isTrue(mock.res.render.calledWith('work-email-confirmation/work-email-confirmation-template'), expectedContext, 'Error with the context');
    });

    it('should redirect if todoList is empty', () => {

      getStatusClientStub.callsArgWith(1, null, { body: null });
      fixtures.getMethodForRoute('/')(mock.req, mock.res);

      assert.isTrue(mock.res.redirect.calledOnce);
      assert.isTrue(mock.res.redirect.calledWith(302));
    });

    it('should render error template if error is present', () => {

      getStatusClientStub.callsArgWith(1, { type: 'TypeError' }, null );
      fixtures.getMethodForRoute('/')(mock.req, mock.res);

      assert.isTrue(mock.res.render.calledOnce);
      assert.isTrue(mock.res.render.calledWith('error/error'));
    });
  });

  describe('/send path', () => {
    it('shoud require a work email', () => {
      mock.req.body.email = null;

      fixtures.getMethodForRoute('/send')(mock.req, mock.res);

      assert(mock.res.status.calledWith(400));
      assert(mock.res.send.calledOnce);
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
              return { links: {
                send: '/work_email_verification/lists/LISTGUID/tasks/TASKGUID/submit?extId=EXTERNALID'
              }};
            }
          }
        });
      });

      it('should return a success state with a success service response', () => {
        submitClientStub.reset();
        submitClientStub.callsArgWith(2, null, {body: 'email'});

        fixtures.getMethodForRoute('/send')(mock.req, mock.res);

        assert.isTrue(mock.res.status.calledWith(200));
        assert.isTrue(mock.res.send.calledWith('email'));
      });

      it('should return an error state when service fails', () => {
        submitClientStub.reset();
        submitClientStub.callsArgWith(2, { response: { status: 500, data: { errors: {} }}});

        fixtures.getMethodForRoute('/send')(mock.req, mock.res);

        assert.isTrue(mock.res.status.calledWith(500));
        assert.isTrue(mock.res.send.calledOnce);
      });
    });
  });

  describe('/optout path', () => {
    it('shoud require optout reason', () => {
      mock.req.body.reason = null;

      fixtures.getMethodForRoute('/optout')(mock.req, mock.res);

      assert(mock.res.status.calledWith(400));
      assert(mock.res.send.calledOnce);
    });

    describe('with required data', () => {
      const goodReason = 'a very good reason';

      it('should return a success state with a success service response', () => {
        mock.req.body.reason = goodReason;

        optOutClientStub.reset();
        optOutClientStub.callsArgWith(2, null, {body: 'success' });

        fixtures.getMethodForRoute('/optout')(mock.req, mock.res);

        assert.isTrue(mock.res.status.calledWith(200));
        assert.isTrue(mock.res.send.calledWith('success'));
      });

      it('should return an error state when service fails', () => {
        mock.req.body.reason = goodReason;

        optOutClientStub.reset();
        optOutClientStub.callsArgWith(2, { response: { status: 500, data: { errors: {} }}});

        fixtures.getMethodForRoute('/optout')(mock.req, mock.res);

        assert.isTrue(mock.res.status.calledWith(500));
        assert.isTrue(mock.res.send.calledOnce);
      });
    });
  });
});
