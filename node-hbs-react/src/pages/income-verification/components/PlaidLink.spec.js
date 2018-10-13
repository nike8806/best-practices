import React from 'react';
import Enzyme, { shallow } from 'enzyme';
import Adapter from 'enzyme-adapter-react-16';
import PlaidLink from './PlaidLink';

// TODO: Put this configuration in just one place
Enzyme.configure({ adapter: new Adapter() });

let plaidInstanceMock;
let onBeforeOpen;

describe('PlaidLink component', () => {
  let component;
  let props;

  describe('With minimal config', () => {
    beforeAll(() => {
      onBeforeOpen = jest.fn();
      plaidInstanceMock = {
        open: jest.fn()
      };
      component = shallow(<PlaidLink plaidInstance={plaidInstanceMock}>Bank link</PlaidLink>);
    });

    it('should render an a tag element', () => {
      expect(component.find('a').length).toBe(1);
    });

    it('should not have an onBeforeOpen handler', () => {
      expect(component.instance().props.onBeforeOpen).toBe(null);
    });

    it('should trigger plaidInstance.open method when clicked', () => {
      component.find('a').simulate('click', {});
      expect(onBeforeOpen).not.toHaveBeenCalled();
      expect(plaidInstanceMock.open).toHaveBeenCalled();
    });
  });

  describe('With institution and before open handler', () => {
    beforeAll(() => {
      onBeforeOpen = jest.fn();
      plaidInstanceMock = {
        open: jest.fn()
      };
      component = shallow(
        <PlaidLink
          institution="wells"
          onBeforeOpen={onBeforeOpen}
          plaidInstance={plaidInstanceMock}
          className="plaid-link"
        >
          Wells
        </PlaidLink>
      );
      ({ props } = component.instance());
    });

    it('should render an a tag element', () => {
      expect(component.find('a').length).toBe(1);
    });

    it('should have an onBeforeOpen handler', () => {
      expect(props.onBeforeOpen).toBe(onBeforeOpen);
    });

    it('should have className set for the <a> element', () => {
      expect(component.find('a.plaid-link').length).toBe(1);
      expect(props.className).toBe('plaid-link');
    });

    it('should trigger plaidInstance.open method when clicked', () => {
      component.find('a').simulate('click', {});
      expect(onBeforeOpen).toHaveBeenCalled();
      expect(onBeforeOpen).toHaveBeenCalledWith({ institution: 'wells' });
      expect(plaidInstanceMock.open).toHaveBeenCalled();
    });
  });

  describe('With institution and no before open handler', () => {
    beforeAll(() => {
      onBeforeOpen = jest.fn();
      plaidInstanceMock = {
        open: jest.fn()
      };
      component = shallow(
        <PlaidLink
          institution="wells"
          plaidInstance={plaidInstanceMock}
          className="plaid-link"
        >
          Wells
        </PlaidLink>
      );
      ({ props } = component.instance());
    });

    it('should render an a tag element', () => {
      expect(component.find('a').length).toBe(1);
    });

    it('should have an onBeforeOpen handler', () => {
      expect(props.onBeforeOpen).toBe(null);
    });

    it('should have className set for the <a> element', () => {
      expect(component.find('a.plaid-link').length).toBe(1);
      expect(props.className).toBe('plaid-link');
    });

    it('should trigger plaidInstance.open method when clicked', () => {
      component.find('a').simulate('click', {});
      expect(onBeforeOpen).not.toHaveBeenCalled();
      expect(plaidInstanceMock.open).toHaveBeenCalled();
      expect(plaidInstanceMock.open).toHaveBeenCalledWith('wells');
    });
  });

  describe('With no institution and with before open handler', () => {
    beforeAll(() => {
      onBeforeOpen = jest.fn();
      plaidInstanceMock = {
        open: jest.fn()
      };

      component = shallow(
        <PlaidLink
          onBeforeOpen={onBeforeOpen}
          plaidInstance={plaidInstanceMock}
          className="plaid-link"
        >
          Wells
        </PlaidLink>
      );
      ({ props } = component.instance());
    });

    it('should render an a tag element', () => {
      expect(component.find('a').length).toBe(1);
    });

    it('should have an onBeforeOpen handler', () => {
      expect(props.onBeforeOpen).toBe(onBeforeOpen);
    });

    it('should have className set for the <a> element', () => {
      expect(component.find('a.plaid-link').length).toBe(1);
      expect(props.className).toBe('plaid-link');
    });

    it('should trigger plaidInstance.open method when clicked', () => {
      component.find('a').simulate('click', {});
      expect(onBeforeOpen).toHaveBeenCalled();
      expect(onBeforeOpen).toHaveBeenCalledWith({ institution: null });
      expect(plaidInstanceMock.open).toHaveBeenCalled();
      expect(plaidInstanceMock.open).toHaveBeenCalledWith(null);
    });
  });

  describe('With no plaidInstance provided', () => {
    beforeAll(() => {
      onBeforeOpen = jest.fn();
      plaidInstanceMock = {
        open: jest.fn()
      };
      component = shallow(
        <PlaidLink
          onBeforeOpen={onBeforeOpen}
          className="plaid-link"
        >
          Wells
        </PlaidLink>
      );
      ({ props } = component.instance());
    });

    it('should trigger plaidInstance.open method when clicked', () => {
      component.find('a').simulate('click', {});
      expect(onBeforeOpen).toHaveBeenCalled();
      expect(onBeforeOpen).toHaveBeenCalledWith({ institution: null });
      expect(plaidInstanceMock.open).not.toHaveBeenCalled();
    });
  });
});
