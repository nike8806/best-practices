var sinon = require('sinon');
var assert = require('chai').assert;
var proxyquire = require('proxyquire');
var dashboardHoldingsContext = require('../server/dashboard-holdings-context.js');
var dashboardHoldingsRoutes = require('../server/dashboard-holdings-routes.js');
var _ = require('lodash');

describe('Dashboard Holding Controller', function() {
  var sandbox, req, res;

  beforeEach(function() {
    sandbox = sinon.sandbox.create();
    res = {
      locals: {
        investor: 70639
      },
      render: sandbox.stub().returns(),
      redirect: sandbox.stub().returns()
    };
    req = {
      user: {
        investor: {
          accountGuid: 70639,
          accountNumber: 1
        }
      }
    }
     holdingsPage = proxyquire('../server/dashboard-holdings-controller.js', {});
  });

  afterEach(function() {
    sandbox.restore();
  });

  it('should set the page context', function() {
    assert.property(dashboardHoldingsContext, 'title');
    assert.isFalse(dashboardHoldingsContext.footer.hideFooter);
  });

  it('should load the proper routes', function(done) {
    dashboardHoldingsRoutes(null, (err, routes) => {
      assert.isTrue(_.some(routes.action, { path: '/' } ));
      done();
    });
  });

  it('should render HBS', function() {
      var expected = 'dashboard-holdings/client/dashboard-holdings';
      holdingsPage.getPage(req, res);
      assert.isTrue(res.render.calledWith(expected), 'render was not called with ' + expected);
    });

});
