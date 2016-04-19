var util = require("util");
var _ = require("lodash");
var assert = require("assert");

var exchanges = {};
var queues = {};

function connect(url, options, connCallback) {
  if (!connCallback) {
    options = {};
    connCallback = options;
  }
  var createChannel = function (channelCallback) {

    var channel = {
      assertQueue: function (queue, options, qCallback) {
        setIfUndef(queues, queue, {messages: [], subscribers: [], options: options});
        qCallback();
      },

      assertExchange: function (exchange, options, exchCallback) {
        setIfUndef(exchanges, exchange, {bindings: [], options: options});
        return exchCallback && exchCallback();
      },

      bindQueue: function (queue, exchange, key, args, bindCallback) {
        bindCallback = bindCallback || console.err;
        if(!exchanges[exchange]) return bindcallback("Bind to non-existing exchange " + exchange);
        var re = "^" + key.replace(".", "\\.").replace("#", "(\\w|\\.)+").replace("*", "\\w+") + "$";
        exchanges[exchange].bindings.push({regex: new RegExp(re), queueName: queue});
        bindCallback();
      },

      publish: function (exchange, routingKey, content, props, pubCallback) {
        pubCallback = pubCallback || console.err;
        if(!exchanges[exchange]) return pubCallback("Publish to non-existing exchange " + exchange);
        var bindings = exchanges[exchange].bindings;
        var matchingBindings = bindings.filter(function (b) {return b.regex.test(routingKey)});
        matchingBindings.forEach(function (binding) {
          var subscribers = queues[binding.queueName] ? queues[binding.queueName].subscribers : [];
          subscribers.forEach(function (sub) {
            var message = {fields: {routingKey: routingKey}, properties: props, content: content};
            sub(message);
          });
        });
        return pubCallback && pubCallback();
      },

      consume: function (queue, handler) {
        queues[queue].subscribers.push(handler);
      },

      deleteQueue: function (queue) {
        setImmediate(function () {
          delete queues[queue];
        });
      },

      ack: function() {},
      nack: function() {},
      prefetch: function() {},
      on: function() {}
    };
    channelCallback(null, channel);
  };

  var connection = {
    createChannel: createChannel,
    createConfirmChannel: createChannel,
    on: function() {}
  };

  connCallback(null, connection);

}

function resetMock() {
  setImmediate(function () {
    queues = {};
    exchanges = {};
  });
}

module.exports = {connect: connect, resetMock: resetMock};

function setIfUndef(object, prop, value) {
  if (!object[prop]) {
    object[prop] = value;
  }
}
