var assert = require('chai').assert;
var validRoutingNumber = require('../link-bank-account-validation-schema').routingNumber.validRoutingNumber;
var validInstitution = require('../link-bank-account-validation-schema').institution;
const errorMessage = 'We cannot identify your routing number. Please enter it again; make sure it includes 9 digits without any dashes, spaces or letters.';

const validBankNames = [
    'WELLS FARGO BANK, NA',
    'BANK OF AMERICA, N.A., CA',
    'FEDERAL RESERVE BK OF SAN FRANCISCO',
    'FEDERAL HOME LOAN BANK OF SF',
    'EAST WEST BANK',
    'ZB NA DBA CALIFORNIA BANK & TRUST',
    'BNP PARIBAS',
    'BANK OF THE ORIENT',
    'SHANGHAI COMMERCIAL BANK, LTD (SF)',
    'HANMI BANK',
    'BANK OF INDIA',
    'CALIFORNIA PACIFIC BANK',
    'MISSION NATIONAL BANK',
    'BANK OF GUAM',
    'INDUSTRIAL & COMM. BNK OF CHINA, NA',
    'BEACON BUSINESS BANK, N'
];

const validRoutingNumbers = [
  '121000248', // WELLS FARGO BANK, NA
  '121000358', // BANK OF AMERICA, N.A., CA
  '121000374', // FEDERAL RESERVE BK OF SAN FRANCISCO
  '121000701', // FEDERAL HOME LOAN BANK OF SF
  '121001865', // EAST WEST BANK
  '121002042', // ZB NA DBA CALIFORNIA BANK & TRUST
  '121027234', // BNP PARIBAS
  '121029672', // BANK OF THE ORIENT
  '121032274', // SHANGHAI COMMERCIAL BANK, LTD (SF)
  '121037240', // HANMI BANK
  '121037266', // BANK OF INDIA
  '121038265', // CALIFORNIA PACIFIC BANK
  '121038773', // MISSION NATIONAL BANK
  '121040169', // BANK OF GUAM
  '121040554', // INDUSTRIAL & COMM. BNK OF CHINA, NA
  '121040651' // BEACON BUSINESS BANK, NA
];

describe('Bank Account Schema Test', () => {
  describe('Bank Name validation -- positive tests', () => {
    it('should return undefined when valid Bank Name is given', () => {
      validBankNames.forEach(function(bankName) {
        var name = { bankName: bankName, firstName: 'firstName', lastName: 'lastName' };

        assert.equal(validInstitution.inputLength({}, '', name, {}), undefined, 'should return undefined when valid Bank Name is given');
        assert.equal(validInstitution.suspicious({}, '', name, {}), undefined, 'should return undefined when valid Bank Name is given');
        assert.equal(validInstitution.noRoutingNumber({}, '', name, {}), undefined, 'should return undefined when valid Bank Name is given');
        assert.equal(validInstitution.noMemberName({}, '', name, {}), undefined, 'should return undefined when valid Bank Name is given');
      });
    });
  });

  describe('Bank Name validation -- negative tests', () => {
    it('should return error message when Bank Name is -- over max length', () => {
      assert.isDefined(validInstitution.inputLength('dkljfashdfklsjahdfkjsadhfaklsjdhfaskjdhfakskjdfhaskdjfhasdkjfhasdkjfhsadkjlf'));
    });

    it('should return error message when Bank Name is -- suspicious characters', () => {
      assert.isDefined(validInstitution.suspicious('<xssattack>'));
    });

    it('should return error message when Bank Name is -- contains uri properties', () => {
      assert.isDefined(validInstitution.suspiciousPlus({}, '', {
        bankName: 'thisbank.com'
      }));
    });

    it('should return error message when Bank Name is -- includes routing number', () => {
      assert.isDefined(validInstitution.noRoutingNumber({}, '', {
        bankName: 'Fifth Third bank 071923909'
      }));
    });

    it('should return error message when Bank Name is -- includes first or last name', () => {
      assert.isDefined(validInstitution.noMemberName({}, '', {
        bankName: 'first Last',
        firstName: 'first',
        lastName: 'last'
      }));
    });
  });

  describe('Routing number validation -- positive tests', () => {
    it('should return undefined when valid routing number is given', () => {
      validRoutingNumbers.forEach(function(routingNumber) {
        assert.equal(validRoutingNumber({}, 'routingNumber', {
          routingNumber: routingNumber
        }, {}), undefined, 'should return undefined when valid routing number is given');
      });
    });
  });
  describe('Routing number validation -- negative tests', () => {
    it('should return error message when invalid routing number is given', () => {
      assert.equal(validRoutingNumber({}, 'routingNumber', {
        routingNumber: '123456789'
      }, {}), errorMessage);
    });

    it('should return error message when invalid routing number is given wrong length', () => {
      assert.equal(validRoutingNumber({}, 'routingNumber', {
        routingNumber: '1'
      }, {}), errorMessage);
    });

    it('should return error message when invalid routing number is given -- trailing zero', () => {
      assert.equal(validRoutingNumber({}, 'routingNumber', {
        routingNumber: '1210003580'
      }, {}), errorMessage);
    });

    it('should return error message when invalid routing number is given -- leading zero', () => {
      assert.equal(validRoutingNumber({}, 'routingNumber', {
        routingNumber: '01210003580'
      }, {}), errorMessage);
    });

    it('should return error message when invalid routing number is given -- leading zero', () => {
      assert.equal(validRoutingNumber({}, 'routingNumber', {
        routingNumber: '0121000358'
      }, {}), errorMessage);
    });

    it('should return error message when invalid routing number is given -- alpha', () => {
      assert.equal(validRoutingNumber({}, 'routingNumber', {
        routingNumber: 'aaaaaaaaa'
      }, {}), errorMessage);
    });

    it('should return error message when invalid routing number is given -- alpha/numeric', () => {
      assert.equal(validRoutingNumber({}, 'routingNumber', {
        routingNumber: '121OOO248'
      }, {}), errorMessage);
    });

    it('should return error message when invalid routing number is given -- short', () => {
      assert.equal(validRoutingNumber({}, 'routingNumber', {
        routingNumber: 121
      }, {}), errorMessage);
    });

    it('should return error message when null is given', () => {
      assert.equal(validRoutingNumber({}, 'routingNumber', null, {}), errorMessage);
    });

    it('should return error message when wrong key is given', () => {
      assert.equal(validRoutingNumber({}, 'routingNumber', null, {routNum: '121027234'}), errorMessage);
    });

    it('should return error message when null is given', () => {
      assert.equal(validRoutingNumber({}, 'routingNumber', {
        routingNumber: null
      }, {}), errorMessage);
    });
  });
});
