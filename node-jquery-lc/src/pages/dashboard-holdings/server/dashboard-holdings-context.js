var Header = require('header-investor');
var header = new Header();
var pageTitle = 'Holdings';

module.exports = {
  title: pageTitle,
  header: header.getContext({
    pageType: 'experience',
    active: 'holdings',
    activeSecondary: 'holdings'
  }),
  footer: {
    hideFooter: false
  }
};