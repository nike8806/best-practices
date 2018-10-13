# Plaid Gallery Component

A react component that renders a bank gallery that triggers the Plaid interface which
allows connection with Plaid services and authentication as well as hooks and events
suitable for most interactions.

## Dependencies

In order to use this component as intended some things need to happen previously:
1) On server-side node, prepare the config needed for plaid and pass it to the front end
2) On client-side, load the plaid-initialize script
3) Create a Plaid Client and pass it to the component

As well as [Snowflake](https://github.tlcinternal.com/pages/UITools/ui-snowflake/docs/versions/1.6.x/build/index.html) to be imported for basic styles.
Classes needed from Snowflake are:
- `col-xs-6`, `col-sm-4` Used for grid positioning and grid width for bank gallery.
- `margin-top-5`, `padding-all-10`, `padding-bottom-0` To add margins/paddings for the bank search control container.
- `text-center` To center content inside the bank search control container.
- `h4` for the "Find your bank" text inside search control container.
- `visible-sm-inline` for the "Even local banks in your hometown" text to dissapear on mobile and display it on desktop only.

For step 1 you need to use both `pbs-client` and `plaid` packages.
Refer to `income-verification-server.js` for a detailed implementation.

With those packages you need to pass these data to the client using
`dynamic-module-registry`:
``` js
// some-page-server.js at the '/' route get level method
get(req, res) {
  // ...
  context.plaidConfig = JSON.stringify({
    clientName: 'LendingClub',
    product: 'auth',
    selectAccount: true,
    env: 'here you need to use plaid package data',
    key: 'as well as this key, from plaid package data'
  });
  return res.render('sope-page/some-page-template', context);
}
```

And for passing it to the client-side:
``` js
{{#defineModule "plaidConfig"}}
  {{{plaidConfig}}}
{{/defineModule}}
```

For step 2 you need to load this script and have it ready for step 3
```
https://cdn.plaid.com/link/v2/stable/link-initialize.js
```

There are several ways to do it, a recommended way to do this is to include it
inside the partial *pageScripts* that renders the scripts for the page, like this:

``` js
// some-template.hbs
{{#partial "pageScripts"}}
  <script src="https://cdn.plaid.com/link/v2/stable/link-initialize.js"></script>
  {{LCScript "runtime"}}
  {{LCScript "common"}}
  {{LCScript "some-page"}}
{{/partial}}
```

For step 3, once the script is loaded, it places a `window.Plaid` object which has
a `create()` method, use it to create a Plaid client and then pass it to the component
like this:

``` js
import 'base-layout';
import React from 'react';
import { render } from 'react-dom';
import SomeComponent from './SomeComponent';
import registry from 'dynamic-module-registry';

const plaidConfig = registry.get('plaidConfig'); // assuming this is as described on step 1
render(<SomeComponent
    plaidConfig={plaidConfig}
    plaidClient={window.Plaid}
  />, document.getElementById('someComponentContainer'));
```

Once you have everything in place, create an instance of `plaidClient`
to pass it to `PlaidGallery` component like this:

``` js
constructor(props) {
  super(props);
  this.createPlaidClient();
}

/**
 * Creates a plaid client using plaid API, external config and handlers.
 */
createPlaidClient() {
  const {
    plaidClient,
    plaidConfig
  } = this.props;

  if (plaidClient && !this.plaidInstance) {
    this.plaidInstance = plaidClient.create({
      ...plaidConfig,
      onSuccess: this.handlePlaidSuccess // handler to control plaid success event
    });
  }
}
```

And finally pass this instance to the component on the render method:

``` js
// SomeComponent.js
// ...
render() {
  handleBeforeOpen = () => { }; // your own implementation

  return (
    <div>
      <PlaidGallery
        onBeforeOpen={this.handleBeforeOpen}
        plaidInstance={this.plaidInstance}
      />
    </div>
  );
}
```

## Overview

The `PlaidGallery` component renders a bank gallery component using the `PlaidLink`
component as a button to trigger the interaction. But all event-logic should be
provided through configuration in the parent component as stated in the previous section.

If you are going to interact with Plaid UI in a different way than the `PlaidGallery`,
you can still take advantage of the `PlaidLink` component on your new component as
an encapsulated way to render buttons that trigger Plaid interactions if needed.

### Props

Prop               | Type         | Required | Default value
------------------ | ------------ | -------- | --------------------------------------
`onBeforeOpen`     | `function`   | `false`  | `null`
`plaidInstance`    | `object`     | `true`   | `null`
`institutions`     | `array`      | `false`  | Refer to the below value *

* Default value for `institutions` prop:
``` json
"institutions": [
  {
    "institution": "chase",
    "ariaLabel": "chase bank logo"
  }, {
    "institution": "wells",
    "ariaLabel": "wells fargo logo"
  }, {
    "institution": "bofa",
    "ariaLabel": "bank of america logo"
  }, {
    "institution": "pnc",
    "ariaLabel": "pnc bank logo"
  }, {
    "institution": "us",
    "ariaLabel": "us bank logo"
  }, {
    "institution": "usaa",
    "ariaLabel": "usaa logo"
  }
]
```


### Props description

- `onBeforeOpen` is a function to invoke once you have clicked on the `PlaidLink` button,
  it uses a fire and forget approach.
- `plaidInstance` is the Plaid interaction object, it provides an `open` method which `PlaidLink` is triggering to launch Plaid interactions.
- `institutions` is the bank gallery bank information to be used for rendering, those can be provided and those will be used
in a dinamically generated grid, if you plan on providing a different set of banks, logos should be provided as well in css
classnames, refer to the `PlaidGallery.less` for details on logo setup.

### State

No state is tracked or needed in this component.

## Usage

### Import / Require component

In your `.js` file:
``` js
import PlaidGallery from './PlaidGallery';
```

_Note_: Remember to import [Snowflake](https://github.tlcinternal.com/pages/UITools/ui-snowflake/docs/versions/1.6.x/build/index.html) for the basic CSS as well.

### Examples

With minimal config:
```js
// some-react-client-component.js
<PlaidGallery
  plaidInstance={this.plaidInstance}
/>
```

And with a handler to trigger on plaid button click:
```js
<PlaidGallery
  onBeforeOpen={this.handleBeforeOpen}
  plaidInstance={this.plaidInstance}
/>
```
