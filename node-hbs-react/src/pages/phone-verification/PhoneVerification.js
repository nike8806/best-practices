import React from 'react';

const PHONE_NUMBER_URL = 'tel:+18885964480';

const PhoneVerification = () => (
  <div className="phone-verification">
    <div className="todo-body">
      <h1 className="todo-heading big">
        Speak with a LendingClub credit specialist
      </h1>
      <p className="todo-text">
        LendingClub needs to verify your phone number as part of the loan
        approval process. We will call you between the hours of 8am and 5pm
        Pacific Time, Monday through Friday. This is not a sales call, but a
        simple phone verification.
      </p>
      <h2 className="todo-heading">
        Or complete your verification now
      </h2>

      <p className="todo-text">
        Please call us at
        {' '}
        <a
          className="todo-link"
          href={PHONE_NUMBER_URL}
        >
          (888)-596-4480
        </a>
        , during our business hours (Monday-Friday: 6am-5pm, Saturday:
        8am-5pm, Pacific Time), from the home phone or work phone provided
        in your loan application.
      </p>

      <a
        className="btn btn-todo center-block"
        href={PHONE_NUMBER_URL}
      >
        Call now
      </a>
    </div>
  </div>
);

export default PhoneVerification;
