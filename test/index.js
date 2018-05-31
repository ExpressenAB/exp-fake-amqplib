"use strict";

const util = require("util");
const {connect, resetMock} = require("..");
const {expect} = require("chai");

describe("fake amqplib", () => {
  describe(".connect()", () => {
    it("exposes the expected api on connection", (done) => {
      connect("amqp://localhost", null, (err, connection) => {
        if (err) return done(err);
        expect(connection).have.property("createChannel").that.is.a("function");
        expect(connection).have.property("createConfirmChannel").that.is.a("function");
        expect(connection).have.property("close").that.is.a("function");
        expect(connection).have.property("on").that.is.a("function");
        done();
      });
    });
  });

  describe("channels", () => {
    let connection;
    before((done) => {
      connect("amqp://localhost", null, (err, conn) => {
        if (err) return done(err);
        connection = conn;
        done();
      });
    });

    it(".createChannel() exposes the expected api", (done) => {
      connection.createChannel((err, channel) => {
        if (err) return done(err);
        expect(channel).have.property("assertQueue").that.is.a("function");
        expect(channel).have.property("assertExchange").that.is.a("function");
        expect(channel).have.property("bindQueue").that.is.a("function");
        expect(channel).have.property("publish").that.is.a("function");
        expect(channel).have.property("consume").that.is.a("function");
        expect(channel).have.property("deleteQueue").that.is.a("function");
        expect(channel).have.property("ack").that.is.a("function");
        expect(channel).have.property("nack").that.is.a("function");
        expect(channel).have.property("prefetch").that.is.a("function");
        expect(channel).have.property("on").that.is.a("function");
        done();
      });
    });

    it(".createConfirmChannel() exposes the expected api", (done) => {
      connection.createConfirmChannel((err, channel) => {
        if (err) return done(err);
        expect(channel).have.property("assertQueue").that.is.a("function");
        expect(channel).have.property("assertExchange").that.is.a("function");
        expect(channel).have.property("bindQueue").that.is.a("function");
        expect(channel).have.property("publish").that.is.a("function");
        expect(channel).have.property("consume").that.is.a("function");
        expect(channel).have.property("deleteQueue").that.is.a("function");
        expect(channel).have.property("ack").that.is.a("function");
        expect(channel).have.property("nack").that.is.a("function");
        expect(channel).have.property("prefetch").that.is.a("function");
        expect(channel).have.property("on").that.is.a("function");
        done();
      });
    });
  });

  describe("matching", () => {
    let connection;
    before((done) => {
      resetMock();
      connect("amqp://localhost", null, (err, conn) => {
        if (err) return done(err);
        connection = conn;
        done();
      });
    });

    const matches = [
      {binding: "testing", routingKey: "testing"},
      {binding: "testing.dot.notation", routingKey: "testing.dot.notation"},
      {binding: "testing.#", routingKey: "testing.dot.notation"},
      {binding: "testing.*", routingKey: "testing.dot"},
      {binding: "testing.*.foo", routingKey: "testing.dot.foo"},
      {binding: "testing.*", routingKey: "testing.dot-foo"},
      {binding: "testing.#", routingKey: "testing.dot-foo.notation_\\hey.1122"}
    ];

    matches.forEach((row) => {
      it(util.format("routing key", row.routingKey, "should be matched by", row.binding), (done) => {
        connection.createChannel((err, channel) => {
          if (err) return done(err);
          listenTmp(channel, row.binding, (msg) => {
            expect(msg.content).to.eql("foo");
            done();
          });
          channel.publish("", row.routingKey, "foo", {});
        });
      });
    });

    const nonMatch = [
      {binding: "testin", routingKey: "testing"},
      {binding: "testing.dot.notation.foo", routingKey: "testing.dot.notation"},
      {binding: "testing.*.baz", routingKey: "testing.dot.bar"},
      {binding: "testing.*.foo.*", routingKey: "testing.dot.foo"}
    ];

    nonMatch.forEach((row) => {
      it(util.format("routing key", row.routingKey, "should NOT be matched by", row.binding), (done) => {
        connection.createChannel((err, channel) => {
          if (err) return done(err);
          listenTmp(channel, row.binding, () => {
            done(new Error(util.format(row.routingKey, "should not be matched by", row.binding)));
          });
          listenTmp(channel, row.routingKey, (msg) => {
            expect(msg.content).to.eql("one");
            done();
          });

          channel.publish("", row.routingKey, "one", {});
        });
      });
    });
    //   connection.createChannel((err, channel) => {
    //     if (err) return done(err);
    //     listenTmp(channel, "testing.#", (msg) => {
    //       expect(msg.content).to.eql("foo");
    //       done();
    //     });
    //     channel.publish("", "testing.dot.notation", "foo", {});

    //   });

    //     channel.assertExchange("");
    //     channel.assertQueue("tmp-test-queue-2");
    //     channel.bindQueue("tmp-test-queue-2", "", "testing.#", {});
    //     channel.consume("tmp-test-queue-2", (msg) => {
    //       expect(msg.content).to.eql("foo");
    //       done();
    //     });
    //     channel.publish("", "testing.dot-foo.notation_\\hey.1122", "foo", {});
    //   });
    // });


    // it("routing with non alpha characters and #", (done) => {
    //   connection.createChannel((err, channel) => {
    //     if (err) return done(err);

    //     channel.assertExchange("");
    //     channel.assertQueue("tmp-test-queue-3");
    //     channel.bindQueue("tmp-test-queue-3", "", "testing.#", {});
    //     channel.consume("tmp-test-queue-3", (msg) => {
    //       expect(msg.content).to.eql("foo");
    //       done();
    //     });
    //     channel.publish("", "testing.dot-foo.notation_\\hey.1122", "foo", {});
    //   });
    // });

  });
});

function listenTmp(channel, routingKey, callback) {
  const queueName = "tmp-queue-" + Math.random().toString(36).replace(/[^a-z]+/g, "");
  channel.assertExchange("");
  channel.assertQueue(queueName);
  channel.bindQueue(queueName, "", routingKey, {});
  channel.consume(queueName, (message) => {
    channel.deleteQueue(queueName);
    callback(message);
  });
}
