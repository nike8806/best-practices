import React from 'react';
import Enzyme, { shallow, mount } from 'enzyme';
import {
  Loader, Modal, Input, SuccessMessage
} from 'components';
import axios from 'lc-axios';

// TODO: Put this configuration in just one place
import Adapter from 'enzyme-adapter-react-16';
import LinkBankAccount from './LinkBankAccount';

Enzyme.configure({ adapter: new Adapter() });

describe('Link Bank Account container', () => {
  let container;
  let onPaymentOptionChangeRequest;

  beforeEach(() => {
    onPaymentOptionChangeRequest = jest.fn();
    container = shallow(
      <LinkBankAccount onPaymentOptionChangeRequest={onPaymentOptionChangeRequest} />
    );
  });

  describe('Mounting', () => {
    it('should render correctly', () => {
      expect(container).toMatchSnapshot();
      expect(container.find(Modal).length).toBe(0);
      expect(container.find(Loader).length).toBe(0);
    });

    it('should render necessary elements', () => {
      expect(container.find('.link-bank-account__radio').length).toBe(2);
      expect(container.find(Input).length).toBe(6);
      expect(container.find('.link-bank-account__bank-account-agreement__checkbox').length).toBe(1);
      expect(container.find('.link-bank-account__payment-agreement__checkbox').length).toBe(1);
    });
  });

  describe('Inputs', () => {
    describe('On Blur', () => {
      it('Should handle input blur"', () => {
        const input = container.find('#link-bank-account-firstname');
        input.simulate('blur', {
          target: {
            name: 'accountHolderFirstName',
            value: ''
          }
        });
        container.update();
        expect(container.state().touched.accountHolderFirstName).toBe(true);
      });

      describe('Touched status', () => {
        it('accountHolderFirstName input should have a touched status', () => {
          const accountHolderFirstNameInput = container.find(Input).at(0);
          accountHolderFirstNameInput.simulate('blur', {
            target: {
              name: 'accountHolderFirstName',
              value: ''
            }
          });
          container.update();
          expect(container.state().touched.accountHolderFirstName).toBe(true);
        });

        it('accountHolderLastName input should have a touched status', () => {
          const accountHolderLastNameInput = container.find(Input).at(1);
          accountHolderLastNameInput.simulate('blur', {
            target: {
              name: 'accountHolderLastName',
              value: ''
            }
          });
          container.update();
          expect(container.state().touched.accountHolderLastName).toBe(true);
        });

        it('institution input should have a touched status', () => {
          const institutionInput = container.find(Input).at(2);
          institutionInput.simulate('blur', {
            target: {
              name: 'institution',
              value: ''
            }
          });
          container.update();
          expect(container.state().touched.institution).toBe(true);
        });

        it('routingNumber input should have a touched status', () => {
          const routingNumberInput = container.find(Input).at(3);
          routingNumberInput.simulate('blur', {
            target: {
              name: 'routingNumber',
              value: ''
            }
          });
          container.update();
          expect(container.state().touched.routingNumber).toBe(true);
        });

        it('accountNumber input should have a touched status', () => {
          const accountNumberInput = container.find(Input).at(4);
          accountNumberInput.simulate('blur', {
            target: {
              name: 'accountNumber',
              value: ''
            }
          });
          container.update();
          expect(container.state().touched.accountNumber).toBe(true);
        });

        it('confirmAccountNumber input should have a touched status', () => {
          const confirmAccountNumberInput = container.find(Input).at(5);
          confirmAccountNumberInput.simulate('blur', {
            target: {
              name: 'confirmAccountNumber',
              value: ''
            }
          });
          container.update();
          expect(container.state().touched.confirmAccountNumber).toBe(true);
        });

        it('bankAccountAgreement input should have a touched status', () => {
          const bankAccountAgreementInput = container.find('.link-bank-account__bank-account-agreement__checkbox').first();
          bankAccountAgreementInput.simulate('blur', {
            target: {
              name: 'bankAccountAgreement',
              checked: false
            }
          });
          container.update();
          expect(container.state().touched.bankAccountAgreement).toBe(true);
        });

        it('paymentAgreement input should have a touched status', () => {
          const paymentAgreementInput = container.find('.link-bank-account__payment-agreement__checkbox').first();
          paymentAgreementInput.simulate('blur', {
            target: {
              name: 'paymentAgreement',
              checked: false
            }
          });
          container.update();
          expect(container.state().touched.paymentAgreement).toBe(true);
        });
      });
    });

    describe('On Change', () => {
      it('Should handle input change"', () => {
        const input = container.find('#link-bank-account-type-checking');
        input.simulate('change', {
          target: {
            name: 'accountType',
            value: 'EXT_CHECKING'
          }
        });
        container.update();
        expect(container.state().accountType).not.toBe('');
      });

      describe('No error when valid format', () => {
        it('accountType input should not have an error if the input has the valid format', () => {
          const accountTypeInput = container.find('#link-bank-account-type-checking').first();
          accountTypeInput.simulate('change', {
            target: {
              name: 'accountType',
              value: 'EXT_CHECKING'
            }
          });
          container.update();
          expect(container.state().inputErrorMessages.accountType).toBe(null);
        });

        it('accountHolderFirstName input should not have an error if the input has the valid format', () => {
          const accountHolderFirstNameInput = container.find(Input).at(0);
          accountHolderFirstNameInput.simulate('change', {
            target: {
              name: 'accountHolderFirstName',
              value: 'Name'
            }
          });
          container.update();
          expect(container.state().inputErrorMessages.accountHolderFirstName).toBe(null);
        });

        it('accountHolderLastName input should not have an error if the input has the valid format', () => {
          const accountHolderLastNameInput = container.find(Input).at(1);
          accountHolderLastNameInput.simulate('change', {
            target: {
              name: 'accountHolderLastName',
              value: 'Test'
            }
          });
          container.update();
          expect(container.state().inputErrorMessages.accountHolderLastName).toBe(null);
        });

        it('institution input should not have an error if the input has the valid format', () => {
          const institutionInput = container.find(Input).at(2);
          institutionInput.simulate('change', {
            target: {
              name: 'institution',
              value: 'Bank of America'
            }
          });
          container.update();
          expect(container.state().inputErrorMessages.institution).toBe(null);
        });

        it('routingNumber input should not have an error if the input has the valid format', () => {
          const routingNumberInput = container.find(Input).at(3);
          routingNumberInput.simulate('change', {
            target: {
              name: 'routingNumber',
              value: '021001318'
            }
          });
          container.update();
          expect(container.state().inputErrorMessages.routingNumber).toBe(null);
        });

        it('accountNumber input should not have an error if the input has the valid format', () => {
          const accountNumberInput = container.find(Input).at(4);
          accountNumberInput.simulate('change', {
            target: {
              name: 'accountNumber',
              value: '1234'
            }
          });
          container.update();
          expect(container.state().inputErrorMessages.accountNumber).toBe(null);
        });

        it('confirmAccountNumber input should not have an error if the input has the valid format', () => {
          const accountNumberInput = container.find(Input).at(4);
          accountNumberInput.simulate('change', {
            target: {
              name: 'accountNumber',
              value: '1234'
            }
          });
          const confirmAccountNumberInput = container.find(Input).at(5);
          confirmAccountNumberInput.simulate('change', {
            target: {
              name: 'confirmAccountNumber',
              value: '1234'
            }
          });
          container.update();
          expect(container.state().inputErrorMessages.confirmAccountNumber).toBe(null);
        });

        it('bankAccountAgreement input should not have an error if the input has the valid format', () => {
          const bankAccountAgreementInput = container.find('.link-bank-account__bank-account-agreement__checkbox').first();
          bankAccountAgreementInput.simulate('change', {
            target: {
              name: 'bankAccountAgreement',
              value: true
            }
          });
          container.update();
          expect(container.state().inputErrorMessages.bankAccountAgreement).toBe(null);
        });

        it('paymentAgreement input should not have an error if the input has the valid format', () => {
          const paymentAgreementInput = container.find('.link-bank-account__payment-agreement__checkbox').first();
          paymentAgreementInput.simulate('change', {
            target: {
              name: 'paymentAgreement',
              value: true
            }
          });
          container.update();
          expect(container.state().inputErrorMessages.paymentAgreement).toBe(null);
        });
      });

      describe('Error when invalid format', () => {
        it('accountType input should show "An account type is required" error when invalid format', () => {
          const accountTypeInput = container.find('#link-bank-account-type-checking').first();
          container.setState({
            touched: {
              accountType: true
            }
          });
          accountTypeInput.simulate('change', {
            target: {
              name: 'accountType',
              value: ''
            }
          });
          container.update();
          expect(container.state().inputErrorMessages.accountType).toBe('An account type is required');
          expect(container.find('.error-message').length).toBe(1);
        });

        it('accountHolderFirstName input should show "Your first name is required" error when invalid format', () => {
          const accountHolderFirstNameInput = container.find(Input).at(0);
          accountHolderFirstNameInput.simulate('change', {
            target: {
              name: 'accountHolderFirstName',
              value: ''
            }
          });
          container.update();
          expect(container.state().inputErrorMessages.accountHolderFirstName).toBe('Your first name is required');
        });

        it('accountHolderFirstName input should show "It appears that you have entered more than one individual\'s first name" error when invalid format', () => {
          const accountHolderFirstNameInput = container.find(Input).at(0);
          accountHolderFirstNameInput.simulate('change', {
            target: {
              name: 'accountHolderFirstName',
              value: 'Name and Test'
            }
          });
          container.update();
          expect(container.state().inputErrorMessages.accountHolderFirstName).toBe('It appears that you have entered more than one individual\'s first name');
        });

        it('accountHolderFirstName input should show "The length of the first name must be less than 40 characters" error when invalid format', () => {
          const accountHolderFirstNameInput = container.find(Input).at(0);
          accountHolderFirstNameInput.simulate('change', {
            target: {
              name: 'accountHolderFirstName',
              value: 'TestTestTestTestTestTestTestTestTestTestTest'
            }
          });
          container.update();
          expect(container.state().inputErrorMessages.accountHolderFirstName).toBe('The length of the first name must be less than 40 characters');
        });

        it('accountHolderLastName input should show "Your last name is required" error when invalid format', () => {
          const accountHolderLastNameInput = container.find(Input).at(1);
          accountHolderLastNameInput.simulate('change', {
            target: {
              name: 'accountHolderLastName',
              value: ''
            }
          });
          container.update();
          expect(container.state().inputErrorMessages.accountHolderLastName).toBe('Your last name is required');
        });

        it('accountHolderLastName input should show "The length of the last name must be less than 40 characters" error when invalid format', () => {
          const accountHolderLastNameInput = container.find(Input).at(1);
          accountHolderLastNameInput.simulate('change', {
            target: {
              name: 'accountHolderLastName',
              value: 'TestTestTestTestTestTestTestTestTestTestTest'
            }
          });
          container.update();
          expect(container.state().inputErrorMessages.accountHolderLastName).toBe('The length of the last name must be less than 40 characters');
        });

        it('institution input should show "Your bank name is required" error when invalid format', () => {
          const institutionInput = container.find(Input).at(2);
          institutionInput.simulate('change', {
            target: {
              name: 'institution',
              value: ''
            }
          });
          container.update();
          expect(container.state().inputErrorMessages.institution).toBe('Your bank name is required');
        });

        it('institution input should show "The name of the financial institution must be less than 75 characters" error when invalid format', () => {
          const institutionInput = container.find(Input).at(2);
          institutionInput.simulate('change', {
            target: {
              name: 'institution',
              value: 'TestTestTestTestTestTestTestTestTestTestTestTestTestTestTestTestTestTestTestTest'
            }
          });
          container.update();
          expect(container.state().inputErrorMessages.institution).toBe('The name of the financial institution must be less than 75 characters');
        });

        it('routingNumber input should show "Your bank routing number is required" error when invalid format', () => {
          const routingNumberInput = container.find(Input).at(3);
          routingNumberInput.simulate('change', {
            target: {
              name: 'routingNumber',
              value: ''
            }
          });
          container.update();
          expect(container.state().inputErrorMessages.routingNumber).toBe('Your bank routing number is required');
        });

        it('routingNumber input should show "Please enter a valid routing number" error when invalid format', () => {
          const routingNumberInput = container.find(Input).at(3);
          routingNumberInput.simulate('change', {
            target: {
              name: 'routingNumber',
              value: 'd1234567'
            }
          });
          container.update();
          expect(container.state().inputErrorMessages.routingNumber).toBe('Please enter a valid routing number');
        });

        it('routingNumber input should show "Routing number should be 9 digits" error when invalid format', () => {
          const routingNumberInput = container.find(Input).at(3);
          routingNumberInput.simulate('change', {
            target: {
              name: 'routingNumber',
              value: '1111'
            }
          });
          container.update();
          expect(container.state().inputErrorMessages.routingNumber).toBe('Routing number should be 9 digits');
        });

        it('routingNumber input should show "We cannot identify your routing number. Please enter it again; make sure it includes 9 digits without any dashes, spaces or letters." error when invalid format', () => {
          const routingNumberInput = container.find(Input).at(3);
          routingNumberInput.simulate('change', {
            target: {
              name: 'routingNumber',
              value: '123456789'
            }
          });
          container.update();
          expect(container.state().inputErrorMessages.routingNumber).toBe('We cannot identify your routing number. Please enter it again; make sure it includes 9 digits without any dashes, spaces or letters.');
        });

        it('accountNumber input should show "Your bank account number is required" error when invalid format', () => {
          const accountNumberInput = container.find(Input).at(4);
          accountNumberInput.simulate('change', {
            target: {
              name: 'accountNumber',
              value: ''
            }
          });
          container.update();
          expect(container.state().inputErrorMessages.accountNumber).toBe('Your bank account number is required');
        });

        it('accountNumber input should show "Please enter your account number using only numbers, without any dashes, spaces or letters" error when invalid format', () => {
          const accountNumberInput = container.find(Input).at(4);
          accountNumberInput.simulate('change', {
            target: {
              name: 'accountNumber',
              value: 'asd3d2ds'
            }
          });
          container.update();
          expect(container.state().inputErrorMessages.accountNumber).toBe('Please enter your account number using only numbers, without any dashes, spaces or letters');
        });

        it('accountNumber input should show "Your bank account number must be 35 characters or less" error when invalid format', () => {
          const accountNumberInput = container.find(Input).at(4);
          accountNumberInput.simulate('change', {
            target: {
              name: 'accountNumber',
              value: '11111111111111111111111111111111111111'
            }
          });
          container.update();
          expect(container.state().inputErrorMessages.accountNumber).toBe('Your bank account number must be 35 characters or less');
        });

        it('confirmAccountNumber input should show "Please confirm your bank account number" error when invalid format', () => {
          const confirmAccountNumberInput = container.find(Input).at(5);
          confirmAccountNumberInput.simulate('change', {
            target: {
              name: 'confirmAccountNumber',
              value: ''
            }
          });
          container.update();
          expect(container.state().inputErrorMessages.confirmAccountNumber).toBe('Please confirm your bank account number');
        });

        it('confirmAccountNumber input should show "Please enter your account number using only numbers, without any dashes, spaces or letters" error when invalid format', () => {
          const confirmAccountNumberInput = container.find(Input).at(5);
          confirmAccountNumberInput.simulate('change', {
            target: {
              name: 'confirmAccountNumber',
              value: 'asd3d2ds'
            }
          });
          container.update();
          expect(container.state().inputErrorMessages.confirmAccountNumber).toBe('Please enter your account number using only numbers, without any dashes, spaces or letters');
        });

        it('confirmAccountNumber input should show "Your confirmed bank account number must be 35 characters or less" error when invalid format', () => {
          const confirmAccountNumberInput = container.find(Input).at(5);
          confirmAccountNumberInput.simulate('change', {
            target: {
              name: 'confirmAccountNumber',
              value: '11111111111111111111111111111111111111'
            }
          });
          container.update();
          expect(container.state().inputErrorMessages.confirmAccountNumber).toBe('Your confirmed bank account number must be 35 characters or less');
        });

        it('confirmAccountNumber input should show "This number must match your bank account number above" error when invalid format', () => {
          const confirmAccountNumberInput = container.find(Input).at(5);
          container.setState({ accountNumber: '1234' });
          confirmAccountNumberInput.simulate('change', {
            target: {
              name: 'confirmAccountNumber',
              value: '1235'
            }
          });
          container.update();
          expect(container.state().inputErrorMessages.confirmAccountNumber).toBe('This number must match your bank account number above');
        });

        it('bankAccountAgreement input should show "Please provide your authorization to verify your bank account" error when invalid format', () => {
          const bankAccountAgreementInput = container.find('.link-bank-account__bank-account-agreement__checkbox').first();
          container.setState({
            touched: {
              bankAccountAgreement: true
            }
          });
          bankAccountAgreementInput.simulate('change', {
            target: {
              name: 'bankAccountAgreement',
              value: false
            }
          });
          container.update();
          expect(container.state().inputErrorMessages.bankAccountAgreement).toBe('Please provide your authorization to verify your bank account');
          expect(container.find('.error-message').length).toBe(1);
        });

        it('should show paymentAgreement errors', () => {
          const paymentAgreementInput = container.find('.link-bank-account__payment-agreement__checkbox').first();
          container.setState({
            touched: {
              paymentAgreement: true
            }
          });
          paymentAgreementInput.simulate('change', {
            target: {
              name: 'paymentAgreement',
              value: false
            }
          });
          container.update();
          expect(container.state().inputErrorMessages.paymentAgreement).toBeTruthy();
          expect(container.find('.error-message').length).toBe(1);
        });
      });
    });
  });

  describe('Clicking submit button', () => {
    const submitMockData = {
      accountType: 'EXT_SAVINGS',
      accountHolderFirstName: 'Name',
      accountHolderLastName: 'Test',
      institution: 'Bank of America',
      routingNumber: '021001318',
      accountNumber: '1234',
      confirmAccountNumber: '1234',
      bankAccountAgreement: true,
      paymentAgreement: true,
      hasPayByCheck: false
    };

    beforeEach(() => {
      container.setState({
        accountType: 'EXT_SAVINGS',
        accountHolderFirstName: 'Name',
        accountHolderLastName: 'Test',
        institution: 'Bank of America',
        routingNumber: '021001318',
        accountNumber: '1234',
        confirmAccountNumber: '1234',
        bankAccountAgreement: true,
        paymentAgreement: true,
        inputErrorMessages: {
          accountType: null,
          accountHolderFirstName: null,
          accountHolderLastName: null,
          institution: null,
          routingNumber: null,
          accountNumber: null,
          confirmAccountNumber: null,
          bankAccountAgreement: null,
          paymentAgreement: null
        }
      });
    });

    it('should display success reponse from the submit service', async () => {
      axios.post = jest.fn(() => Promise.resolve());
      container.find('.link-bank-account__btn-submit').simulate('click', { preventDefault() {} });
      expect(axios.post).toHaveBeenCalledWith('/todo/link-bank-account/submit', submitMockData);
      expect(container.find(Loader).length).toBe(1);
      await axios.post;
      container.update();
      expect(container.find(Loader).length).toBe(0);
      expect(container.find(SuccessMessage).length).toBe(1);
    });

    it('On error reponse from the service should display an error', async () => {
      axios.post = jest.fn(() => Promise.reject(new Error({ error: 'Error consuming service' })));
      container.find('.link-bank-account__btn-submit').simulate('click', { preventDefault() {} });
      expect(axios.post).toHaveBeenCalledWith('/todo/link-bank-account/submit', submitMockData);
      expect(container.find(Loader).length).toBe(1);
      await axios.post;
      await container.setState;
      container.update();
      expect(container.find(Loader).length).toBe(0);
      expect(container.find(Modal).length).toBe(1);
    });

    it('On error reponse from the service should display an error', async () => {
      const errorResponse = {
        errors: [{
          errorCode: 'MISSING_PRIMARY_ACCT_HOLDER_FIRSTNAME',
          error: 'The first name of the Primary account holder is required'
        },
        {
          errorCode: 'INVALID_BANK_ACCOUNT_NUMBER',
          error: 'Please enter your account number using only numbers, without any dashes, spaces or letters'
        }
        ]
      };
      axios.post = jest.fn(() => Promise.reject(errorResponse));
      container.find('.link-bank-account__btn-submit').simulate('click', { preventDefault() {} });
      expect(axios.post).toHaveBeenCalledWith('/todo/link-bank-account/submit', submitMockData);
      expect(container.find(Loader).length).toBe(1);
      await axios.post;
      await container.setState;
      container.update();
      expect(container.find(Loader).length).toBe(0);
      expect(container.find(Modal).length).toBe(1);
      expect(container.find('li').length).toBe(3);
    });

    it('Submit should do nothing when invalid form', () => {
      axios.post = jest.fn(() => Promise.resolve());
      container.setState({
        accountType: '',
        accountHolderFirstName: '',
        accountHolderLastName: '',
        institution: '',
        routingNumber: '',
        accountNumber: '',
        confirmAccountNumber: '',
        bankAccountAgreement: false,
        paymentAgreement: false
      });
      container.find('.link-bank-account__btn-submit').simulate('click', { preventDefault() {} });
      expect(axios.post).not.toHaveBeenCalled();
    });
  });

  describe('At Modal oppened', () => {
    let mountedContainer;

    beforeEach(() => {
      jest.useFakeTimers();
      mountedContainer = mount(<LinkBankAccount />);
    });

    it('The modal should be closed when the user click outside', () => {
      mountedContainer.setState({ modalMessage: 'Error' });
      expect(mountedContainer.find(Modal).length).toBe(1);
      mountedContainer.find(Modal).find('.modal-backdrop').simulate('click', { preventDefault() {} });
      mountedContainer.update();
      expect(mountedContainer.find(Modal).length).toBe(0);
    });

    it('The modal should be closed after 5 seconds', () => {
      mountedContainer.setState({ modalMessage: 'Error' });
      expect(mountedContainer.find(Modal).length).toBe(1);
      jest.runAllTimers();
      mountedContainer.update();
      expect(mountedContainer.find(Modal).length).toBe(0);
    });
  });

  describe('Payment agreements', () => {
    it('Should show alert when cliking "Change this"', () => {
      expect(container.find('.alert').length).toBe(0);
      container.find('.btn-todo-link').simulate('click');
      container.setState({ hasPayByCheck: true });
      expect(container.find('.alert').length).toBe(1);
      expect(container.find('.alert').at(0).text()).toBe('You will need to send your monthly payment in on your own, with an additional $7 check processing fee added to the amount. Change this.');
    });

    it('Should change check label text when changing to pay by check', () => {
      container.setState({ hasPayByCheck: true });
      expect(container.find('.link-bank-account__payment-agreement__label').find('.todo-text').text()).toBe('your confirmation that you will make payments by check.');
    });

    it('Should check hasPayByCheck when setPayByCheck is called', () => {
      container.instance().setPayByCheck(true);
      container.update();
      expect(container.find('.link-bank-account__payment-agreement__label').find('.todo-text').text()).toBe('your confirmation that you will make payments by check.');
    });

    it('Should call onPaymentOptionChangeRequest when clicking "Change this payment option"', () => {
      container.find('.visible-inline .btn-todo-link').simulate('click', { preventDefault() {} });
      container.update();
      container.find('.visible-inline .btn-todo-link').at(1).simulate('click', { preventDefault() {} });
      expect(onPaymentOptionChangeRequest).toHaveBeenCalled();
    });
  });

  describe('Success message', () => {
    it('Should show success message when form section is not shown"', () => {
      container.setState({ showFormSection: false });
      expect(container.find(SuccessMessage).length).toBe(1);
    });
  });
});
