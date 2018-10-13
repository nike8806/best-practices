const { validators, createValidator } = require('ui-validator');

const ROUTING_ERROR_MESSAGE = 'We cannot identify your routing number. Please enter it again; make sure it includes 9 digits without any dashes, spaces or letters.';
const TEXT_LIMIT_REGEX = new RegExp('.*(@|(\\.com|\\.net|\\.edu|\\.gov|\\.org|\\.biz)(?![a-z])|\\*).*');
const NUMBER_LIMIT_REGEX = new RegExp('.*(\\d[\\*\\.\\(\\)\\s-]*){9,}.*');

const isTrueValidator = createValidator(({ message }, value) => {
  const isBoolean = typeof value === 'boolean';
  if (isBoolean && value !== true) {
    return message;
  }
  return null;
});

module.exports = {
  accountHolderFirstName: {
    required: validators.required({ message: 'Your first name is required' }),
    twoNames: validators.twoNames({ message: 'It appears that you have entered more than one individual\'s first name' }),
    inputLength: validators.inputLength({ max: 40, message: 'The length of the first name must be less than 40 characters' }),
    suspicious: validators.suspicious()
  },
  accountHolderLastName: {
    required: validators.required({ message: 'Your last name is required' }),
    inputLength: validators.inputLength({ max: 40, message: 'The length of the last name must be less than 40 characters' }),
    suspicious: validators.suspicious()
  },
  institution: {
    required: validators.required({ message: 'Your bank name is required' }),
    inputLength: validators.inputLength({
      max: 75,
      overMaxMessage: 'The name of the financial institution must be less than 75 characters'
    }),
    suspicious: validators.suspicious(),
    suspiciousPlus: (options, key, valueObject) => {
      const bankName = (valueObject && valueObject.bankName)
        ? valueObject.bankName.toLowerCase() : null;

      if (TEXT_LIMIT_REGEX.test(bankName)) {
        return 'Please enter a valid bank name';
      }
      return null;
    },
    noRoutingNumber: (options, key, valueObject) => {
      const bankName = (valueObject && valueObject.bankName) ? valueObject.bankName : null;

      if (NUMBER_LIMIT_REGEX.test(bankName)) {
        return 'Please enter a valid bank name';
      }
      return null;
    },
    noMemberName: (options, key, valueObject) => {
      const bankName = (valueObject && valueObject.bankName)
        ? valueObject.bankName.toLowerCase() : null;
      const lastName = (valueObject && valueObject.lastName)
        ? valueObject.lastName.toLowerCase() : null;
      const firstName = (valueObject && valueObject.firstName)
        ? valueObject.firstName.toLowerCase() : null;

      if (bankName && (bankName.indexOf(firstName) > -1 || bankName.indexOf(lastName) > -1)) {
        return 'Please enter a valid bank name';
      }
      return null;
    }
  },
  routingNumber: {
    required: validators.required({ message: 'Your bank routing number is required' }),
    isNumber: validators.isNumber({ message: 'Please enter a valid routing number' }),
    inputLength: validators.inputLength({
      min: 9,
      max: 9,
      message: 'Routing number should be 9 digits'
    }),
    validRoutingNumber: (options, key, valueObject) => {
      const routingNumber = (valueObject && valueObject.routingNumber)
        ? valueObject.routingNumber : null;

      if (!/^\d{9}$/.test(routingNumber)) {
        return ROUTING_ERROR_MESSAGE;
      }

      let chksm = 0;
      const mask = [3, 7, 1, 3, 7, 1, 3, 7, 1];

      for (let i = 0; i < 9; i += 1) {
        chksm += +routingNumber[i] * mask[i];
      }

      if (chksm % 10 !== 0) {
        return ROUTING_ERROR_MESSAGE;
      }
      return null;
    }
  },
  accountNumber: {
    required: validators.required({ message: 'Your bank account number is required' }),
    validBankAccount: validators.validBankAccount(),
    inputLength: validators.inputLength({
      max: 35,
      overMaxMessage: 'Your bank account number must be 35 characters or less'
    }),
    suspicious: validators.suspicious()
  },
  confirmAccountNumber: {
    required: validators.required({ message: 'Please confirm your bank account number' }),
    validBankAccount: validators.validBankAccount(),
    inputLength: validators.inputLength({
      max: 35,
      overMaxMessage: 'Your confirmed bank account number must be 35 characters or less'
    }),
    sameAsField: validators.sameAsField({ target: 'accountNumber', message: 'This number must match your bank account number above' }),
    suspicious: validators.suspicious()
  },
  accountType: {
    required: validators.required({ message: 'An account type is required' })
  },
  bankAccountAgreement: {
    required: isTrueValidator({ message: 'Please provide your authorization to verify your bank account' })
  },
  paymentAgreementElectronically: {
    required: isTrueValidator({
      message: `Please provide your authorization to make payments electronically.
      If you don't want to make payments electronically, you can choose to pay by check by clicking the "change this" link`
    })
  },
  paymentAgreementByCheck: {
    required: isTrueValidator({
      message: `Please provide your authorization to make payments by check.
      If you don't want to make payments by check, you can choose to make payments electronically by clicking the "change this" link`
    })
  }
};
