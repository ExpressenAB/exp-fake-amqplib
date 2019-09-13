"use strict";

const {Broker} = require("smqp");

module.exports = Fake();

function Fake() {
  const connections = [];
  return {
    resetMock,
    connect,
  };

  function connect(...args) {
    const connection = Connection(...args);
    connections.push(connection);
    return resolveOrCallback(args.pop(), null, connection);
  }

  function resetMock() {
    for (const connection of connections) {
      connection.close();
    }
  }

  function Connection() {
    const broker = Broker();

    connections.push(broker);

    return {
      _broker: broker,
      createChannel(...args) {
        return resolveOrCallback(args.pop(), null, Channel(broker));
      },
      createConfirmChannel(...args) {
        return resolveOrCallback(args.pop(), null, Channel(broker, true));
      },
      close() {
        broker.reset();
      },
      on() {},
    };
  }

  function Channel(broker, confirm) {
    return {
      assertExchange(...args) {
        return callBroker(broker.assertExchange, ...args);
      },
      assertQueue(...args) {
        return callBroker(broker.assertQueue, ...args);
      },
      bindQueue(...args) {
        return callBroker(broker.bindQueue, ...args);
      },
      deleteQueue(...args) {
        return callBroker(broker.deleteQueue, ...args);
      },
      publish(exchange, routingKey, content, ...args) {
        return confirm ? broker.publish(exchange, routingKey, content, ...args) : callBroker(broker.publish, exchange, routingKey, content, ...args);
      },
      sendToQueue(...args) {
        return confirm ? broker.sendToQueue(...args) : callBroker(broker.sendToQueue, ...args);
      },
      consume(queue, onMessage, ...args) {
        const passArgs = args.length ? args : [{}];
        return callBroker(broker.consume, queue, onMessage && handler, ...passArgs);
        function handler(_, msg) {
          onMessage(msg);
        }
      },
      cancel(...args) {
        return callBroker(broker.cancel, ...args);
      },
      ack: broker.ack,
      ackAll: broker.ackAll,
      nack: broker.nack,
      reject: broker.reject,
      nackAll: broker.nackAll,
      prefetch() {},
      on: broker.on,
    };

    function callBroker(fn, ...args) {
      let [poppedCb] = args.slice(-1);
      if (typeof poppedCb === "function") args.splice(-1);
      else poppedCb = null;

      return new Promise((resolve, reject) => {
        try {
          const result = fn(...args);
          if (poppedCb) poppedCb(null, result);
          return resolve(result);
        } catch (err) {
          if (!poppedCb) return reject(err);
          poppedCb(err);
          return resolve();
        }
      });
    }
  }
}

function resolveOrCallback(optionalCb, err, ...args) {
  if (typeof optionalCb === "function") optionalCb(err, ...args);
  return Promise.resolve(...args);
}
