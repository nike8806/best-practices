var $ = require('lc-jquery');
var assert = require('chai').assert;
var Client = require('../client/dashboard-holdings-client');

describe('Holdings Details Page', function() {
  describe('Client function', function() {
    var containerMock, client;

    beforeEach(function() {
      containerMock = $('<main>test</main>');
      client = new Client(containerMock);
    });
    it('should have a container defined', function() {
      assert.equal(client.container, containerMock, 'container is not defined');
    });
  });

});

