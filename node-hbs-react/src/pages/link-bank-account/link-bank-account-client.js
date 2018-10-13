/* eslint-disable import/no-unresolved */
import 'base-layout';
import React from 'react';
import { render } from 'react-dom';
import RecurrentPaymentModule from 'recurrent-payment-module/recurrent-payment-module';
import LinkBankAccount from './LinkBankAccount';

let linkBankAccountContainer;
render(
  <LinkBankAccount
    ref={(instance) => {
      linkBankAccountContainer = instance;
    }}
    onPaymentOptionChangeRequest={RecurrentPaymentModule.open((payByCheck) => {
      linkBankAccountContainer.setPayByCheck(payByCheck);
    })}
  />,
  document.getElementById('page-content')
);
