"use strict";

let exchanges = {};
let queues = {};

function connect(url, options, connCallback) {
  if (!connCallback) {
    options = {};
    connCallback = options;
  }

  const connection = {
    createChannel,
    createConfirmChannel: createChannel,
    on: function () {},
    close: resetMock,
  };

  return connCallback(null, connection);

  function createChannel(channelCallback) {
    channelCallback(null, {
      assertQueue,
      assertExchange,
      bindQueue,
      publish,
      consume,
      deleteQueue,
      ack,
      nack,
      prefetch,
      on,
    });

    function assertQueue(queue, qOptions, qCallback) {
      qCallback = qCallback || function () {};
      setIfUndef(queues, queue, {messages: [], subscribers: [], options: qOptions});
      qCallback();
    }

    function assertExchange(exchange, type, exchOptions, exchCallback) {
      if (typeof (exchOptions) === "function") {
        exchCallback = exchOptions;
        exchOptions = {};
      }
      setIfUndef(exchanges, exchange, {bindings: [], options: exchOptions, type: type});
      return exchCallback && exchCallback();
    }

    function bindQueue(queue, exchange, key, args, bindCallback) {
      bindCallback = bindCallback || function () {};
      if (!exchanges[exchange]) return bindCallback("Bind to non-existing exchange " + exchange);
      const re = "^" + quoteRegexp(key).replace(/#/g, ".+").replace(/\*/g, "[^\\.]+") + "$";
      exchanges[exchange].bindings.push({regex: new RegExp(re), queueName: queue});
      bindCallback();
    }

    function publish(exchange, routingKey, content, props, pubCallback) {
      pubCallback = pubCallback || function () {};
      if (!exchanges[exchange]) return pubCallback("Publish to non-existing exchange " + exchange);
      const bindings = exchanges[exchange].bindings;
      const matchingBindings = bindings.filter((b) => b.regex.test(routingKey));
      matchingBindings.forEach((binding) => {
        const subscribers = queues[binding.queueName] ? queues[binding.queueName].subscribers : [];
        subscribers.forEach((sub) => {
          const message = {fields: {routingKey: routingKey}, properties: props, content: content};
          sub(message);
        });
      });
      return pubCallback && pubCallback();
    }

    function consume(queue, handler) {
      queues[queue].subscribers.push(handler);
    }

    function deleteQueue(queue) {
      setImmediate(() => {
        delete queues[queue];
      });
    }

    function ack() {}
    function nack() {}
    function prefetch() {}
    function on() {}
  }
}

function quoteRegexp(str) {
  return (str + "").replace(/[.?+^$[\]\\(){}|-]/g, "\\$&");
}

function resetMock() {
  queues = {};
  exchanges = {};
}

function setIfUndef(object, prop, value) {
  if (!object[prop]) {
    object[prop] = value;
  }
}

module.exports = {connect: connect, resetMock: resetMock};
