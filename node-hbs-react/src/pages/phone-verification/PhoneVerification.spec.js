import React from 'react';
import Enzyme, { shallow } from 'enzyme';
import Adapter from 'enzyme-adapter-react-16';
import PhoneVerification from './PhoneVerification';

// TODO: Put this configuration in just one place
Enzyme.configure({ adapter: new Adapter() });

describe('Phone verification React component', () => {
  let component;

  beforeEach(() => {
    component = shallow(<PhoneVerification />);
  });

  it('should render correctly', () => {
    expect(component).toMatchSnapshot();
  });

  it('should render headings', () => {
    expect(component.find('h1.todo-heading .big').exists()).toEqual(true);
    expect(component.find('h2.todo-heading').exists()).toEqual(true);
  });

  it('should render paragraphs', () => {
    const paragraphs = component.find('p.todo-text');
    expect(paragraphs.length).toBe(2);
    expect(
      paragraphs
        .at(1)
        .children()
        .at(2)
        .hasClass('todo-link')
    ).toEqual(true);
  });

  it('should render a Call now button', () => {
    const button = component.find('a.btn .btn-todo .center-block');
    expect(button.exists()).toEqual(true);
    expect(button.prop('href')).toBe('tel:+18885964480');
  });

  it('should render link with correct number', () => {
    const link = component.find('a.todo-link');
    expect(link.exists()).toEqual(true);
    expect(link.text()).toBe('(888)-596-4480');
    expect(link.prop('href')).toBe('tel:+18885964480');
  });
});
