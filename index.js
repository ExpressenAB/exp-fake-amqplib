"use strict";

const EventEmitter = require("events");

let exchanges = {};
let queues = {};
const acks = new EventEmitter();
acks.setMaxListeners(1000);
module.exports = {connect, resetMock, probeMessages, publishMessage, waitForAck};

function probeMessages(queue) {
  if (!queues[queue]) throw new Error(`Queue '${queue}' not found`);
  return queues[queue].messages;
}

function publishMessage(exchange, routingKey, data, props = {}) {
  let buffer;
  if (typeof data === "string") {
    buffer = Buffer.from(data, "utf8");
  } else if (data instanceof Buffer) {
    buffer = data;
  } else {
    props.contentType = "application/json";
    buffer = Buffer.from(JSON.stringify(data), "utf8");
  }
  return internalPublishMessage(exchange, routingKey, buffer, props);
}

function internalPublishMessage(exchange, routingKey, content, props) {
  if (!exchanges[exchange]) throw new Error("Publish to non-existing exchange " + exchange);
  const bindings = exchanges[exchange].bindings;
  const matchingBindings = bindings.filter((b) => b.regex.test(routingKey));
  const refId = Math.random().toString(36).toString(2, 9);
  matchingBindings.forEach((binding) => {
    const subscribers = queues[binding.queueName] ? queues[binding.queueName].subscribers : [];
    subscribers.forEach((sub) => {
      const message = {
        fields: {routingKey: routingKey}, properties: props || {}, content: content, _refId: refId
      };
      sub(message);
    });
  });
  return refId;
}

function waitForAck(refId, count = 1) {
  let acked = 0;
  return new Promise(( resolve, reject) => {
    acks.on("ack", (ackedRefId) => {
      if (refId === ackedRefId) {
        acked = acked + 1;
        if (acked >= count) {
          resolve();
        }
      }
    });
    acks.on("nack", (ackedRefId) => {
      if (refId === ackedRefId) {
        reject("Message was nacked");
      }
    });
  });
}

function connect(url, options, connCallback) {
  if (!connCallback) {
    options = {};
    connCallback = options;
  }

  const connection = {
    createChannel: createChannel(false),
    createConfirmChannel: createChannel(true),
    on: function () {},
    close: resetMock,
  };

  return connCallback(null, connection);

  function createChannel(confirm) {
    return (channelCallback) => {
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
        const re = "^" + key.replace(".", "\\.").replace("#", "(\\S)+").replace("*", "\\w+") + "$";
        exchanges[exchange].bindings.push({regex: new RegExp(re), queueName: queue});
        bindCallback();
      }

      function publish(exchange, routingKey, content, props, pubCallback) {
        internalPublishMessage(exchange, routingKey, content, props);
        if (confirm) pubCallback();
        return true;
      }

      function consume(queue, handler) {
        queues[queue].subscribers.push(handler);
      }

      function deleteQueue(queue) {
        setImmediate(() => {
          delete queues[queue];
        });
      }

      function ack(message) {
        acks.emit("ack", message._refId);
      }
      function nack(message) {
        acks.emit("nack", message._refId);
      }
      function prefetch() {}
      function on() {}
    };
  }
}

function resetMock() {
  queues = {};
  exchanges = {};
  acks.removeAllListeners();
}

function setIfUndef(object, prop, value) {
  if (!object[prop]) {
    object[prop] = value;
  }
}
