"use strict";

var amqpBehaviour = {
  url: "www.example.com",
  exchange: "fakeAmqpExchange",
  confirm: true,
  ack: true,
  prefetch: 1
};

function error(err) {
  logger.error("Killing myself over amqp error:", err);
  process.exit(1);
}
var broker = require("exp-amqp-connection")(amqpBehaviour);

broker.on("error", error);

module.exports = broker;