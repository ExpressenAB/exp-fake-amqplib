"use strict";

const {connect} = require("..");
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
});
