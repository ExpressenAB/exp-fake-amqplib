"use strict";
var proxyquire = require("proxyquire");
var fakeAmqp = require("../../.");
process.env.NODE_ENV = "test";

proxyquire("exp-amqp-connection/bootstrap", {
  "amqplib/callback_api": fakeAmqp
});
