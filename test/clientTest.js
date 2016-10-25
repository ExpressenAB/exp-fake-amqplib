"use strict";

var should = require("should");
var broker = require("./helpers/broker");

describe("Client", function() {

  it("should publish and subscribe", function(done) {
    var message = {
      one: 1
    };
    // Create a new queue for each subscribe
    broker.subscribe("messageKey", "someQueue", function(received) {
      received.should.eql(message)
      broker.deleteQueue("someQueue");
      done();
    });
    broker.publish("messageKey", message)
  });

  it("should publish and subscribe with temporary queue", function(done) {
    var message = {
      one: 1
    };
    // Create a new queue for each subscribe
    broker.subscribeTmp("messageKey2", function(received) {
      received.should.eql(message)
      done();
    });
    broker.publish("messageKey2", message)
  });

  it("should tear down a queue", function(done) {
    var message = {
      two: 2,
    };

    const receivedMessages = [];

    // Create a new queue for each subscribe
    broker.subscribe("messageKey3", "someQueue-2", function(received) {
      receivedMessages.push(received);
      received.should.eql(message)
      receivedMessages.length.should.eql(1);
      
      broker.deleteQueue("someQueue-2");
      broker.publish("messageKey3", message);
      setTimeout(function () {
        done();       
      }, 30);
    });
    broker.publish("messageKey3", message)
  })
});