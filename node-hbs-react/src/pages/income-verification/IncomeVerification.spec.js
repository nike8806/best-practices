import React from 'react';
import Enzyme, { shallow } from 'enzyme';
import { Loader, SuccessMessage } from 'components';
import axios from 'lc-axios';

import heapTrack from 'heap-track/heap-track';

// TODO: Put this configuration in just one place
import Adapter from 'enzyme-adapter-react-16';
import PlaidGallery from './components/PlaidGallery';
import IncomeVerification from './IncomeVerification';

jest.mock('heap-track/heap-track.js');

Enzyme.configure({ adapter: new Adapter() });

const plaidMock = {
  create: jest.fn().mockReturnValue({ open: jest.fn() })
};

const plaidConfig = {
  clientName: 'LendingClub',
  product: ['auth', 'transactions'],
  selectAccount: true,
  env: 'sandbox',
  key: 'key123'
};

describe('IncomeVerification component', () => {
  let component;
  let state;
  beforeEach(() => {
    heapTrack.mockReset();
  });

  describe('With minimal config', () => {
    beforeEach(() => {
      component = shallow(<IncomeVerification plaidClient={plaidMock} plaidConfig={plaidConfig} />);
      ({ state } = component.instance());
    });

    it('should render the bank gallery', () => {
      expect(component.find(PlaidGallery).length).toBe(1);
      expect(state.showSection).toBe('bankGallery');
    });

    it('should call plaid.create', () => {
      expect(plaidMock.create).toHaveBeenCalled();
      expect(component.instance().plaidInstance).not.toBe(null);
      expect(heapTrack).toHaveBeenCalled();
      expect(heapTrack).toHaveBeenNthCalledWith(1, 'TDL Income Verification', {
        TYPE: 'Plaid Not Linked'
      });
    });
  });

  describe('Without plaid linked - Optout scenario', () => {
    beforeAll(() => {
      component = shallow(<IncomeVerification
        plaidClient={plaidMock}
        plaidConfig={plaidConfig}
        plaidAlreadyLinked={false}
      />);
      ({ state } = component.instance());
    });

    it('should render the bank gallery', () => {
      expect(component.find(PlaidGallery).length).toBe(1);
      expect(state.showSection).toBe('bankGallery');
    });

    it('should call plaid.create', () => {
      expect(plaidMock.create).toHaveBeenCalled();
      expect(component.instance().plaidInstance).not.toBe(null);
    });

    it('should display a modal for optout interaction if click on optout link', () => {
      component.find('.income-verification__show-optout-link').simulate('click', {});

      expect(component.find('.todo-modal').length).toBe(1);
      expect(component.instance().state.showOptoutModal).toBe(true);
    });

    it('should dismiss the modal if clicked on back button', () => {
      component.find('.income-verification__optout-back').simulate('click', {});

      expect(component.find('.todo-modal').length).toBe(0);
      expect(component.instance().state.showOptoutModal).toBe(false);
    });

    it('should handle error on optout when service throws an error', async () => {
      axios.post = jest.fn(() => Promise.reject(new Error('foo')));
      component.find('.income-verification__show-optout-link').simulate('click', {});

      expect(component.find('.todo-modal').length).toBe(1);
      expect(component.instance().state.showOptoutModal).toBe(true);

      component.find('.income-verification__optout-action').simulate('click', {});
      ({ state } = component.update().instance());
      expect(component.find('.todo-modal').length).toBe(0);
      expect(state.showOptoutModal).toBe(false);

      expect(component.find(Loader).length).toBe(1);
      expect(state.showLoader).toBe(true);
      expect(axios.post).toHaveBeenCalledWith('/todo/income-verification/optout');
      await axios.post;
      await component.setState;
      ({ state } = component.update().instance());
      expect(state.showLoader).toBe(false);
      expect(state.showOptoutSuccess).toBe(false);
      expect(state.serverErrorMessage).not.toBe(null);

      expect(heapTrack).toHaveBeenCalled();
      expect(heapTrack).toHaveBeenNthCalledWith(1, 'TDL Income Verification', {
        TYPE: 'Click Optout Confirmation Button'
      });
      expect(heapTrack).toHaveBeenNthCalledWith(2, 'TDL Income Verification', {
        TYPE: 'Optout Submission',
        STATUS: 'error'
      });
    });

    it('should do optout correctly when service answers correctly', async () => {
      component.instance().handleHideErrorModal();
      axios.post = jest.fn(() => Promise.resolve({ data: 'foo' }));
      // click the link, validate modal is being displayed
      component.find('.income-verification__show-optout-link').simulate('click', {});
      ({ state } = component.update().instance());
      expect(component.find('.todo-modal').length).toBe(1);
      expect(state.showOptoutModal).toBe(true);

      // do optout, validate modal dismiss, loader shows up, service is called
      component.find('.income-verification__optout-action').simulate('click', {});
      ({ state } = component.update().instance());
      expect(component.find('.todo-modal').length).toBe(0);
      expect(state.showOptoutModal).toBe(false);

      expect(component.find(Loader).length).toBe(1);
      expect(state.showLoader).toBe(true);
      expect(axios.post).toHaveBeenCalledWith('/todo/income-verification/optout');
      await axios.post;
      await component.setState;
      ({ state } = component.update().instance());

      // validate state is as expected
      expect(state.showLoader).toBe(false);
      expect(state.showOptoutSuccess).toBe(true);
      expect(state.showSection).toBe('');

      expect(heapTrack).toHaveBeenCalled();
      expect(heapTrack).toHaveBeenNthCalledWith(1, 'TDL Income Verification', {
        TYPE: 'Click Optout Confirmation Button'
      });
      expect(heapTrack).toHaveBeenNthCalledWith(2, 'TDL Income Verification', {
        TYPE: 'Optout Submission',
        STATUS: 'success'
      });
    });

    describe('on click on back to todoList button', () => {
      it('should track the event', () => {
        component.find('.income-verification__optout-success-return-task-list').simulate('click', {});
        expect(heapTrack).toHaveBeenCalled();
        expect(heapTrack).toHaveBeenNthCalledWith(1, 'TDL Income Verification', {
          TYPE: 'Click Optout Success Confirmation'
        });
      });
    });
  });

  describe('Without plaid linked - Optin scenario - sign agreement', () => {
    beforeAll(() => {
      component = shallow(<IncomeVerification
        plaidClient={plaidMock}
        plaidConfig={plaidConfig}
        plaidAgreementType="Agreement"
        plaidAgreementVersion={1}
        plaidAlreadyLinked={false}
      />);
      ({ state } = component.instance());
    });

    it('should render the bank gallery', () => {
      expect(component.find(PlaidGallery).length).toBe(1);
      expect(state.showSection).toBe('bankGallery');
    });

    it('should call plaid.create', () => {
      expect(plaidMock.create).toHaveBeenCalled();
      expect(component.instance().plaidInstance).not.toBe(null);
    });

    it('should handle error for sign agreement when service throws an error', async () => {
      axios.post = jest.fn(() => Promise.reject(new Error('foo')));
      component.instance().handleBeforeOpen({ institution: 'Bank of America' });
      component.update();

      expect(axios.post).toHaveBeenCalledWith('/todo/agreements/submit-plaid-agreement', {
        plaidAgreementType: 'Agreement',
        plaidAgreementVersion: 1
      });
      await axios.post;
      await component.setState;
      ({ state } = component.update().instance());
      expect(state.serverErrorMessage).toBe(null);
      expect(heapTrack).toHaveBeenNthCalledWith(2, 'TDL Income Verification', {
        TYPE: 'Agreement Submission',
        STATUS: 'error'
      });
    });

    it('when the service answers correctly should send to heaptrack the event', async () => {
      axios.post = jest.fn(() => Promise.resolve({ data: 'foo' }));
      component.instance().handleBeforeOpen({ institution: 'Bank of America' });
      component.update();

      expect(axios.post).toHaveBeenCalledWith('/todo/agreements/submit-plaid-agreement', {
        plaidAgreementType: 'Agreement',
        plaidAgreementVersion: 1
      });

      await axios.post;
      await component.setState;
      ({ state } = component.update().instance());

      // validate state is as expected
      expect(state.serverErrorMessage).toBe(null);
      expect(heapTrack).toHaveBeenNthCalledWith(2, 'TDL Income Verification', {
        TYPE: 'Agreement Submission',
        STATUS: 'success'
      });
    });

    it('should track when was click on the gallery', async () => {
      component.instance().handleBeforeOpen({ institution: 'Bank of America' });
      expect(heapTrack).toHaveBeenNthCalledWith(1, 'TDL Income Verification', {
        TYPE: 'Click Plaid Bank Logo',
        BANK_NAME: 'Bank of America'
      });
    });

    it('should track when was click on the find your bank', async () => {
      component.instance().handleBeforeOpen({});
      expect(heapTrack).toHaveBeenNthCalledWith(1, 'TDL Income Verification', {
        TYPE: 'Click Plaid Bank Logo',
        BANK_NAME: 'other'
      });
    });
  });

  describe('Without plaid linked - Optin scenario - plaid success', () => {
    let plaidData;

    beforeAll(() => {
      plaidData = {
        public_token: 'public-token',
        account_id: 'SomeAccountId',
        institution: {
          name: 'Bank of America'
        }
      };
      component = shallow(<IncomeVerification
        plaidClient={plaidMock}
        plaidConfig={plaidConfig}
        plaidAgreementType="Agreement"
        plaidAgreementVersion={1}
        plaidAlreadyLinked={false}
      />);
      ({ state } = component.instance());

      // Simulate that was clicked an institution ond the gallery
      component.instance().handleBeforeOpen({ institution: 'Bank of America' });
      component.update();
    });

    it('should render the bank gallery', () => {
      expect(component.find(PlaidGallery).length).toBe(1);
      expect(state.showSection).toBe('bankGallery');
    });

    it('should call plaid.create', () => {
      expect(plaidMock.create).toHaveBeenCalled();
      expect(component.instance().plaidInstance).not.toBe(null);
    });

    it('should show an error message when service throws an error', async () => {
      axios.post = jest.fn(() => Promise.reject(new Error('foo')));
      component.instance().handlePlaidSuccess('token', plaidData);
      component.update();

      // Loader should be displayed
      expect(component.find(Loader).length).toBe(1);
      expect(component.instance().state.showLoader).toBe(true);

      expect(axios.post).toHaveBeenCalledWith('/todo/income-verification/optin', {
        public_token: plaidData.public_token,
        account_id: plaidData.account_id,
        institution: {
          name: 'Bank of America'
        },
        plaidAgreementType: 'Agreement',
        plaidAgreementVersion: 1
      });
      await axios.post;
      await component.setState;
      ({ state } = component.update().instance());
      expect(component.find(Loader).length).toBe(0);
      expect(state.showLoader).toBe(false);
      expect(state.showPlaidSuccess).toBe(false);
      expect(component.find(SuccessMessage).length).toBe(0);
      expect(state.serverErrorMessage).not.toBe(null);
      expect(component.find('.todo-modal').length).toBe(1);

      expect(heapTrack).toHaveBeenCalled();
      expect(heapTrack).toHaveBeenNthCalledWith(1, 'TDL Income Verification', {
        TYPE: 'Optin Submission',
        BANK_NAME: 'Bank of America',
        STATUS: 'error'
      });
    });

    describe('when the service is correctly', () => {
      beforeEach(() => {
        component.instance().handleHideErrorModal();
        axios.post = jest.fn(() => Promise.resolve({ data: 'foo' }));
        component.instance().handlePlaidSuccess('token', plaidData);
        component.update();
      });

      it('should be executed the post correctly', () => {
        // Loader should be displayed
        expect(component.find(Loader).length).toBe(1);
        expect(axios.post).toHaveBeenCalledWith('/todo/income-verification/optin', {
          public_token: plaidData.public_token,
          account_id: plaidData.account_id,
          institution: {
            name: 'Bank of America'
          },
          plaidAgreementType: 'Agreement',
          plaidAgreementVersion: 1
        });
      });

      it('should display a success message', async () => {
        await axios.post;
        await component.setState;
        ({ state } = component.update().instance());
        // validate state is as expected
        expect(component.find(Loader).length).toBe(0);
        expect(state.showLoader).toBe(false);
        expect(state.showPlaidSuccess).toBe(true);
        expect(component.find(SuccessMessage).length).toBe(1);
        expect(state.showSection).toBe('');
        expect(component.find(PlaidGallery).length).toBe(0);
      });

      it('should track the optin submission', () => {
        expect(heapTrack).toHaveBeenCalled();
        expect(heapTrack).toHaveBeenNthCalledWith(1, 'TDL Income Verification', {
          TYPE: 'Optin Submission',
          BANK_NAME: 'Bank of America',
          STATUS: 'success'
        });
      });

      describe('on click on back to todoList button', () => {
        it('should track the event', () => {
          component.find('.income-verification__optout-success-return-task-list').simulate('click', {});
          expect(heapTrack).toHaveBeenCalled();
          expect(heapTrack).toHaveBeenNthCalledWith(2, 'TDL Income Verification', {
            TYPE: 'Click Optin Success Confirmation'
          });
        });
      });
    });
  });

  describe('With plaid linked previously - initial scenario - retry plaid connection', () => {
    beforeAll(() => {
      jest.useFakeTimers();
      component = shallow(<IncomeVerification
        plaidClient={plaidMock}
        plaidConfig={plaidConfig}
        plaidAgreementType="Agreement"
        plaidAgreementVersion={1}
        plaidAlreadyLinked
        plaidInstitutionName="Bank of America"
        plaidInstitutionLogo="1234567890"
      />);
      ({ state } = component.instance());
    });

    it('should render the step1 view', () => {
      expect(component.find('.income-verification__logo-container').length).toBe(1);
      expect(state.showSection).toBe('step1');
    });

    it('should call plaid.create', () => {
      expect(plaidMock.create).toHaveBeenCalled();
      expect(component.instance().plaidInstance).not.toBe(null);
    });

    it('should render step2 view', () => {
      component.find('.income-verification__next-step').simulate('click', {});

      jest.runAllTimers();
      expect(component.instance().state.showSection).toBe('step2');
      expect(component.update().find('.income-verification__connect-bank').text()).toBe('Connect another bank');

      expect(heapTrack).toHaveBeenCalled();
      expect(heapTrack).toHaveBeenNthCalledWith(1, 'TDL Income Verification', {
        TYPE: 'Click Use Existing Plaid Account Button'
      });
    });

    it('should render bankGallery view', () => {
      component.find('.income-verification__connect-bank').simulate('click', {});

      expect(component.instance().state.showSection).toBe('bankGallery');
      expect(component.update().find(PlaidGallery).length).toBe(1);
    });
  });

  describe('With plaid linked previously - default logo', () => {
    beforeAll(() => {
      component = shallow(<IncomeVerification
        plaidClient={plaidMock}
        plaidConfig={plaidConfig}
        plaidAgreementType="Agreement"
        plaidAgreementVersion={1}
        plaidAlreadyLinked
        plaidInstitutionName="Bank of America"
        plaidInstitutionLogo={null}
      />);
      ({ state } = component.instance());
    });

    it('should render the default logo', () => {
      expect(component.find('.income-verification__logo--default').length).toBe(1);
    });
  });

  describe('Without plaid client', () => {
    const plaidMock2 = {
      create: jest.fn().mockReturnValue({ open: jest.fn() })
    };

    beforeAll(() => {
      component = shallow(<IncomeVerification
        plaidClient={plaidMock2}
        plaidConfig={plaidConfig}
        plaidAlreadyLinked={false}
      />);
      ({ state } = component.instance());
    });

    it('should not call plaid.create more than once', () => {
      component.update().instance().createPlaidClient();
      expect(component.instance().plaidInstance).not.toBeUndefined();
      expect(plaidMock2.create).toHaveBeenCalledTimes(1);
    });
  });

  describe('On plaid opened - trackEvents', () => {
    const metadataMock = {
      error_code: null,
      institution_name: 'US Bank',
      institution_type: 'us',
      link_session_id: '43696362-159d-4bcc-9570-a0e2ee0d9cba',
      timestamp: '2018-09-21T01:26:34.943Z'
    };

    beforeAll(() => {
      component = shallow(<IncomeVerification
        plaidClient={plaidMock}
        plaidConfig={plaidConfig}
        plaidAgreementType="Agreement"
        plaidAgreementVersion={1}
        plaidAlreadyLinked={false}
      />);
      ({ state } = component.instance());

      // Simulate that was clicked an institution ond the gallery
      component.instance().handleBeforeOpen({ institution: 'Bank of America' });
      component.update();
    });

    describe('On event occurs on the plaid', () => {
      const eventName = 'SELECT_INSTITUTION';
      beforeEach(() => {
        component.instance().handlePlaidEvent(eventName, metadataMock);
        component.update();
      });
      it('should track with heaptrack', () => {
        expect(heapTrack).toHaveBeenCalled();
        expect(heapTrack).toHaveBeenNthCalledWith(1, 'TDL Income Verification', {
          ACTION: 'plaid-link-event',
          EVENT_NAME: eventName,
          CONSUMER: 'borrower',
          METADATA_error_code: metadataMock.error_code,
          METADATA_institution_name: metadataMock.institution_name,
          METADATA_institution_type: metadataMock.institution_type,
          METADATA_link_session_id: metadataMock.link_session_id,
          METADATA_timestamp: metadataMock.timestamp
        });
      });
    });

    describe('On exit from the plaid', () => {
      it('should track with heaptrack', () => {
        metadataMock.exit_status = 'requires_credentials';
        component.instance().handlePlaidExit(null, metadataMock);
        component.update();
        expect(heapTrack).toHaveBeenCalled();
        expect(heapTrack).toHaveBeenNthCalledWith(1, 'TDL Income Verification',
          { ACTION: 'exit-plaid', STATUS: 'success' });
      });
      it('should track with heaptrack with error', () => {
        metadataMock.exit_status = 'requires_credentials';
        component.instance().handlePlaidExit('ERROR', metadataMock);
        component.update();
        expect(heapTrack).toHaveBeenCalled();
        expect(heapTrack).toHaveBeenNthCalledWith(1, 'TDL Income Verification',
          { ACTION: 'exit-plaid', STATUS: 'error' });
      });
    });
  });
});
