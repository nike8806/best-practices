import React from 'react';
import Enzyme, { shallow } from 'enzyme';
import WorkEmail from './WorkEmail';

// TODO: Put this configuration in just one place
import Adapter from 'enzyme-adapter-react-16';
Enzyme.configure({ adapter: new Adapter() });
const cbSubmitWorkEmailMock = () => { };

test('Input Work Email render correctly', () => {
  const component = shallow(<WorkEmail onSubmit={cbSubmitWorkEmailMock} />);

  expect(component).toMatchSnapshot();
});

test('Capture the user input', () => {
  const component = shallow(<WorkEmail onSubmit={cbSubmitWorkEmailMock} />);

  component.find('input').simulate('change', { target: { value: 'some@email.tld' } });

  expect(component.state().email).toBe('some@email.tld');
});

test('Valite when click the button', () => {
  const component = shallow(<WorkEmail onSubmit={cbSubmitWorkEmailMock} />);

  expect(component.state().validated).toBe(false);

  component.find('button').simulate('click');
  expect(component.state().validated).toBe(true);
});

test('Display error message when try submit without email', () => {
  const component = shallow(<WorkEmail onSubmit={cbSubmitWorkEmailMock} />);

  expect(component.find('.error-message').length).toBe(0);

  component.find('button').simulate('click');
  expect(component.update().find('.error-message').length).toBe(1);
  expect(component).toMatchSnapshot();
});

test('Display error message when try submit an invalid email', () => {
  const component = shallow(<WorkEmail onSubmit={cbSubmitWorkEmailMock} />);

  expect(component.find('.error-message').length).toBe(0);

  component.find('input').simulate('change', { target: { value: 'user@gmail.com' } });
  component.find('button').simulate('click');

  component.update();

  expect(component.state().email).toBe('user@gmail.com');
  expect(component.find('.error-message').length).toBe(1);
  expect(component).toMatchSnapshot();
});
