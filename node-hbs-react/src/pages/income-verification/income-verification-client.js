import 'base-layout';
import React from 'react';
import { render } from 'react-dom';
import IncomeVerification from './IncomeVerification';
import registry from 'dynamic-module-registry';

const plaidConfig = registry.get('plaidConfig');
const {
  plaidAgreementType,
  plaidAgreementVersion,
  institutionName,
  hasPlaidData,
  institutionLogo
} = registry.get('plaidData');

render(<IncomeVerification
  plaidConfig={plaidConfig}
  plaidClient={window.Plaid}
  plaidAgreementType={plaidAgreementType}
  plaidAgreementVersion={plaidAgreementVersion}
  plaidAlreadyLinked={hasPlaidData}
  plaidInstitutionName={institutionName}
  plaidInstitutionLogo={institutionLogo}
/>, document.getElementById('income-verification'));
