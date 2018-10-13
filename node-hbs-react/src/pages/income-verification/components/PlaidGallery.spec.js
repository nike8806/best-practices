import React from 'react';
import Enzyme, { shallow } from 'enzyme';
import PlaidGallery from './PlaidGallery';

// TODO: Put this configuration in just one place
import Adapter from 'enzyme-adapter-react-16';
Enzyme.configure({ adapter: new Adapter() });

let plaidInstanceMock;
let onBeforeOpen;

const PLAID_GALLERY = '.row-flush';
const PLAID_LINK = 'PlaidLink';
const BANK_ITEM = 'PlaidLink.plaid-gallery__bank-logo';

describe('PlaidGallery component', () => {
  let component;

  describe('With minimal config', () => {
    beforeAll(() => {
      onBeforeOpen = jest.fn();
      plaidInstanceMock = {
        open: jest.fn()
      };
      component = shallow(<PlaidGallery plaidInstance={plaidInstanceMock} />);
    });

    it('should render expected elements', () => {
      expect(component.find(PLAID_GALLERY).length).toBe(1);
      expect(component.find(PLAID_LINK).length).toBe(7);
    });

    it('should have 6 items in bank gallery', () => {
      expect(component.find(BANK_ITEM).length).toBe(6);
    });

    it('should have 6 institutions with a non-empty value', () => {
      component.find(BANK_ITEM)
        .map(bank => bank.prop('institution'))
        .forEach(institution => {
          expect(institution).not.toBe(null);
        });
    });

    it('should not have an onBeforeOpen handler', () => {
      expect(component.instance().props.onBeforeOpen).toBe(null);
    });

    it('should have a plaidInstance object defined', () => {
      expect(component.instance().props.plaidInstance).toBe(plaidInstanceMock);
    });
  });

  describe('With before open handler', () => {
    beforeAll(() => {
      onBeforeOpen = jest.fn();
      plaidInstanceMock = {
        open: jest.fn()
      };
      component = shallow(<PlaidGallery
        onBeforeOpen={onBeforeOpen}
        plaidInstance={plaidInstanceMock}
      />);
    });

    it('should render expected elements', () => {
      expect(component.find(PLAID_GALLERY).length).toBe(1);
      expect(component.find(PLAID_LINK).length).toBe(7);
    });

    it('should have 6 items in bank gallery', () => {
      expect(component.find(BANK_ITEM).length).toBe(6);
    });

    it('should have 6 institutions with a non-empty value', () => {
      component.find(BANK_ITEM)
        .map(bank => bank.prop('institution'))
        .forEach(institution => {
          expect(institution).not.toBe(null);
        });
    });

    it('should have an onBeforeOpen handler', () => {
      expect(component.instance().props.onBeforeOpen).toBe(onBeforeOpen);
    });

    it('should have a plaidInstance object defined', () => {
      expect(component.instance().props.plaidInstance).toBe(plaidInstanceMock);
    });
  });
});
