var sinon = require('sinon');
var assert = require('chai').assert;
var proxyquire = require('proxyquire');
var mockDom = '<!DOCTYPE html><html lang=\'en\'><head> <meta charset=\'UTF-8\'> <meta name=\'viewport\' content=\'width=device-width, initial-scale=1.0\'> <meta http-equiv=\'X-UA-Compatible\' content=\'ie=edge\'> <title>Document</title></head><body> </body></html>';
var notesMock = [{
  loanStatus: 'Fully Paid',
  grade: 'A',
  loanLength: 36,
  principalPending: 0,
  noteCount: 118,
  totalPrincipalAmount: 4625
}];

describe('Dashboard Holdings Controller', function() {
  var req, res, sandbox, holdings, mock, availableAccountInfoStub;

  beforeEach(function() {
    sandbox = sinon.sandbox.create();
    holdings = proxyquire('../server/dashboard-holdings-controller.js', {
      'actor-info': {
        accountId: availableAccountInfoStub
      }
    });
    sinon.stub(holdings, 'getPage');
    sinon.stub(holdings, 'getAllNotes');
    res = {
      render: sandbox.spy(),
      redirect: sandbox.spy()
    };
    req = {
      user: {
        investor: {
          accountGuid: 232244
        }
      }
    };
    availableAccountInfoStub = sandbox.stub();

    mock = {
      client: {
        getAllNotes: sandbox.stub().yields(null, {}, notesMock)
      }
    };
  });
  afterEach(function() {});

  describe('getpage test', function() {
    beforeEach(function() {
      res = {
        render: sandbox.spy()
      };
      res.render(mockDom);
    });
    it('should render the page', function() {
      var expected = mockDom;
      assert.isTrue(res.render.calledWith(expected), 'render was called with ' + expected);
    });
  });


  describe('allNotes', () => {
    it('should return an object with all key required', () => {
      mock.client.getAllNotes = sandbox.stub().yields(true);
      holdings.getAllNotes(123456, (err, result) => {
        result.map((element) => {
          assert.deepEqual(Object.keys(element), ['loanId',
            'noteId',
            'noteStatus',
            'noteAmount',
            'term',
            'grade',
            'rate',
            'purpose',
            'loanAmount',
            'loanStatus',
            'orderId',
            'issuedDate',
            'outstandingPrincipal',
            'paymentsReceived',
            'nextPaymentDate'
          ]);
        });
      });
    });
  });
});
