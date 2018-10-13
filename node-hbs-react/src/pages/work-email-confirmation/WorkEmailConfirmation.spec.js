import React from 'react';
import Enzyme, { shallow, mount } from 'enzyme';
import WorkEmailConfirmation from './WorkEmailConfirmation';
import axios from 'lc-axios';
import { SuccessMessage, Modal, Input} from 'components';

// TODO: Put this configuration in just one place
import Adapter from 'enzyme-adapter-react-16';
Enzyme.configure({ adapter: new Adapter() });

const ERROR_SELECTOR = '.work-email-confirmation__modal-error',
  EMAIL_SENT_SELECTOR = '.work-email-confirmation__modal-email-sent',
  MODAL_NOT_WANT_SELECTOR = '.work-email-confirmation__modal-not-want',
  EMAIL_SECTION_SELECTOR = '.work-email-confirmation__email-section';

/**
 * Tested Component reference along the tests cases.
 */
describe('WorkEmail Confirmation Spec React component', () => {
  let component;
  beforeEach(() => {
    component = shallow(<WorkEmailConfirmation />);
  });

  it('WorkEmailConfirmation render correctly', () => {
    expect(component).toMatchSnapshot();
  });

  describe('WorkEmail input', () => {
    let workEmailInput;
    beforeEach(() => {
      workEmailInput = component.find(Input).first();
    });
    describe('On Blur', () => {
      it('The input should have a touched status', () => {
        workEmailInput.simulate('blur', {
          target: {
            value: 'assa@someEmail.com'
          }});
        expect(component.instance().state.touchedWorkEmail).toBe(true);
      });
    });
    describe('On Change', () => {
      it('The input should Not Have an error if the input has the valid format', () => {
        workEmailInput.simulate('change', {
          target: {
            value: 'some@email.tld'
          }
        });
        component.update();
        expect(component.instance().state.errorWorkEmail).toBe(undefined);
      });
      it('The input should have an error "WorkEmail Required" if the value is empty', () => {
        workEmailInput.simulate('change', {
          target: {
            value: 'some@email.tld'
          }
        });
        component.update();
        workEmailInput.simulate('change', {
          target: {
            value: ''
          }
        });
        component.update();
        expect(component.instance().state.errorWorkEmail).toBe('Work email is required.');
      });

      it('The input should have an error if the email is invalid', () => {
        workEmailInput.simulate('change', {
          target: {
            value: 'some@'
          }
        });
        component.update();
        expect(component.instance().state.errorWorkEmail).toBe('Please specify a valid email address');
      });

      it('The input should have an error if the domain is a Provider not permited', () => {
        const errorMessage = `Sorry, we can\'t accept addresses from popular email providers
        (gmail, hotmail, yahoo, etc.). If you don\'t have any other work email address,
        please select \'I don\'t have a work email.\'`;
        workEmailInput.simulate('change', {
          target: {
            value: 'some@gmail.com'
          }
        });
        component.update();
        expect(component.instance().state.errorWorkEmail).toBe(errorMessage);
      });
    });
  });

  describe('On click on submit button', () => {
    let submitButton, workEmailInput;
    beforeEach(() => {
      submitButton = component.update().find('button.work-email-confirmation__btn-submit-email').first();
      workEmailInput = component.update().find(Input).first();
    });
    it('should not send the info if workEmail has an error', () => {
      workEmailInput.simulate('change', {
        target: {
          value: ''
        }
      });
      component.update();
      submitButton.simulate('click');
      expect(component.instance().state.errorWorkEmail).toEqual('Work email is required.');
      expect(component.update().find(EMAIL_SECTION_SELECTOR).length).toBe(1);
      expect(component.find(SuccessMessage).length).toBe(0);
      expect(component.find(Modal).length).toBe(0);
      expect(component.find(EMAIL_SENT_SELECTOR).length).toBe(0);
      expect(component.find(ERROR_SELECTOR).length).toBe(0);
    });
    it('should handle submit making an AJAX success request', (done) => {
      axios.post = jest.fn(() => Promise.resolve({ data: 'foo' }));
      workEmailInput.simulate('change', {
        target: {
          value: 'some@email.tld'
        }
      });
      submitButton.simulate('click');
      Promise.all([axios.post]).then(() => {
        expect(axios.post).toHaveBeenCalledWith('/todo/work-email-confirmation/send', { email: 'some@email.tld' });
        expect(component.update().find(Modal).length).toBe(1);
        expect(component.find(EMAIL_SENT_SELECTOR).length).toBe(1);
        expect(component.find(ERROR_SELECTOR).length).toBe(0);
        expect(component).toMatchSnapshot();
        done();
      });
    });
    it('should show a modal with error if request fails', (done) => {
      axios.post = jest.fn(() => Promise.reject({ error: 'foo' }));
      workEmailInput.simulate('change', {
        target: {
          value: 'some@email.tld'
        }
      });
      submitButton.simulate('click');
      Promise.all([axios.post]).then(() => {
        expect(axios.post).toHaveBeenCalledWith('/todo/work-email-confirmation/send', { email: 'some@email.tld' });
        expect(component.update().find(Modal).length).toBe(1);
        expect(component.find(ERROR_SELECTOR).length).toBe(1);
        expect(component).toMatchSnapshot();
        done();
      });
    });
  });

  describe('On optOut submit', () => {
    describe('Do not have click', () => {
      let doNotHaveButton;
      beforeEach(() => {
        doNotHaveButton = component.find('button.work-email-confirmation__btn-optout-do-not-have').first();
      });
      it('should handle opt out when request response is ok', (done) => {
        axios.post = jest.fn(() => Promise.resolve({ data: 'foo' }));
        doNotHaveButton.simulate('click');
        Promise.all([axios.post]).then(() => {
          expect(axios.post).toHaveBeenCalledWith('/todo/work-email-confirmation/optout', { reason: 'DO_NOT_HAVE' });
          expect(component.update().find(SuccessMessage).length).toBe(1);
          expect(component.update().find(ERROR_SELECTOR).length).toBe(0);
          expect(component).toMatchSnapshot();
          done();
        });
      });
      it('should show a modal with error if request fails', (done) => {
        axios.post = jest.fn(() => Promise.reject({ error: 'foo' }));
        doNotHaveButton.simulate('click');
        Promise.all([axios.post]).then(() => {
          expect(axios.post).toHaveBeenCalledWith('/todo/work-email-confirmation/optout', { reason: 'DO_NOT_HAVE' });
          expect(component.update().find(Modal).length).toBe(1);
          expect(component.find(ERROR_SELECTOR).length).toBe(1);
          expect(component).toMatchSnapshot();
          done();
        });
      });
    });

    describe('Do not want click', () => {
      let openModalDoNotWantButton;
      beforeEach(() => {
        openModalDoNotWantButton = component.find('button.work-email-confirmation__btn-show-opt-out-section').first();
        openModalDoNotWantButton.simulate('click');
        expect(component).toMatchSnapshot();
      });
      it('should show modal with "Do not want" options', () => {
        expect(component.update().find(Modal).length).toBe(1);
        expect(component.find(MODAL_NOT_WANT_SELECTOR).length).toBe(1);
      });

      describe('On "I understand, but I\'d prefer not to" button click', () => {
        let doNotWantButton;
        beforeEach(() => {
          doNotWantButton = component.find('button.work-email-confirmation__btn-optout-do-not-want').first();
        });
        it('should show a success message when get a success response', (done) => {
          axios.post = jest.fn(() => Promise.resolve({ data: 'foo' }));
          doNotWantButton.simulate('click');
          Promise.all([axios.post]).then(() => {
            expect(axios.post).toHaveBeenCalledWith('/todo/work-email-confirmation/optout', { reason: 'DO_NOT_WANT' });
            expect(component.update().find(SuccessMessage).length).toBe(1);
            done();
          });
        });

        it('should show a modal with error if request fails', (done) => {
          axios.post = jest.fn(() => Promise.reject({ error: 'foo' }));
          doNotWantButton.simulate('click');
          Promise.all([axios.post]).then(() => {
            expect(axios.post).toHaveBeenCalledWith('/todo/work-email-confirmation/optout', { reason: 'DO_NOT_WANT' });
            expect(component.update().find(Modal).length).toBe(1);
            expect(component.find(ERROR_SELECTOR).length).toBe(1);
            done();
          });
        });
      });
      describe('On "Go back to the faster way" buttton click', () => {
        let fasterWayButton;
        beforeEach(() => {
          fasterWayButton = component.find('button.work-email-confirmation__btn-fast-way').first();
        });
        it('should close the modal', () => {
          fasterWayButton.simulate('click');
          expect(component.update().find(Modal).length).toBe(0);
          expect(component.update().find(EMAIL_SECTION_SELECTOR).length).toBe(1);
          expect(component.update().find(SuccessMessage).length).toBe(0);
        });
      });
    });
  });
  describe('At modal oppened', () => {
    beforeEach(() => {
      jest.useFakeTimers();
      component = mount(<WorkEmailConfirmation />);
    });

    it('The modal should be closed when the user click outside', () => {
      component.setState({ showModal: 'ERROR' });
      let modalInstance = component.update().find(Modal);
      expect(modalInstance.length).toBe(1);
      modalInstance.find('.modal-backdrop').first().simulate('click', { preventDefault() {} });
      expect(component.update().find(Modal).length).toBe(0);
    });

    it('An ERROR Modal should be closed after 5 seconds', () => {
      component.setState({ showModal: 'ERROR' });
      expect(component.update().find(Modal).length).toBe(1);
      jest.runAllTimers();
      expect(component.update().find(Modal).length).toBe(0);
    });

    it('An EMAIL_SENT Modal should be closed after 5 seconds', () => {
      component.setState({ showModal: 'EMAIL_SENT' });
      expect(component.update().find(Modal).length).toBe(1);
      jest.runAllTimers();
      expect(component.update().find(Modal).length).toBe(0);
    });
  });
});
