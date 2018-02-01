const authorize = require('lc-authorize');
const controller = require('./dashboard-holdings-controller.js');

function registerPaths(boreas, register) {
  register(null, {
    path: '/investor/:account?/:accountNumber?/holdings',
    middleware: [authorize(), 'multiAccount'],
    action: [{
      restricted: true,
      path: '/',
      context: require('./dashboard-holdings-context.js'),
      get: controller.getPage
    },
    {
      restricted: true,
      path: '/all-notes',
      get: controller.getAllNotes

    }
    ]
  });
}

module.exports = registerPaths;
