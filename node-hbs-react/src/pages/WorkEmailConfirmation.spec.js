import React from 'react';
import Enzyme, { shallow } from 'enzyme';
import WorkEmailConfirmation from './WorkEmailConfirmation';
import { Notification } from 'components';
import axios from 'lc-axios';

// TODO: Put this configuration in just one place
import Adapter from 'enzyme-adapter-react-16';
Enzyme.configure({ adapter: new Adapter() });


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

  it('should handle submit making an AJAX request', () => {
    axios.post = jest.fn(() => Promise.resolve({ data: 'foo' }));
    component.instance().handleSubmit('some@email.tld');
    Promise.all([axios.post]).then(() => {
      expect(axios.post).toHaveBeenCalledWith('/todo/work-email-confirmation/send', { email: 'some@email.tld' });
      expect(component.update().find(Notification).length).toBe(0);
    });
  });
  it('should display an error notification if request fails', () => {
    axios.post = jest.fn(() => Promise.reject({ error: 'foo' }));
    component.instance().handleSubmit('some@email.tld');
    Promise.all([axios.post]).then(() => {
      expect(axios.post).toHaveBeenCalledWith('/todo/work-email-confirmation/send', { email: 'some@email.tld' });
      expect(component.update().find(Notification).length).toBe(1);
    });
  });

  it('should handle opt out when request response is ok', () => {
    axios.post = jest.fn(() => Promise.resolve({ data: 'foo' }));
    component.find('button.work-email-confirmation__btn-optout-do-not-have').first().simulate('click');

    Promise.all([axios.post]).then(() => {
      expect(axios.post).toHaveBeenCalledWith('/todo/work-email-confirmation/optout', { reason: 'DO_NOT_HAVE' });
      expect(component.update().find(Notification).length).toBe(0);
    });
  });

  it('should handle opt out when request fails', () => {
    axios.post = jest.fn(() => Promise.reject({ error: 'foo' }));

    component.find('button.work-email-confirmation__btn-optout-do-not-have').first().simulate('click');

    Promise.all([axios.post]).then(() => {
      expect(axios.post).toHaveBeenCalledWith('/todo/work-email-confirmation/optout', { reason: 'DO_NOT_HAVE' });
      expect(component.update().find(Notification).length).toBe(1);
    });
  });

  it('should toggle opt out options when click in do not want link', () => {
    component.find('button.work-email-confirmation__btn-show-opt-out-section').first().simulate('click');

    expect(component.update().state().sectionToShow).toBe('optOutSection');
  });
});
