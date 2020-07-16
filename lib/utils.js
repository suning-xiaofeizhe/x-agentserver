'use strict';

const crypto = require('crypto');
const EventEmitter = require('events').EventEmitter;

exports.sha1 = function sha1(str, key) {
  return crypto.createHmac('sha1', key).update(str).digest('hex');
};

exports.signature = function signature(data, secret) {
  return exports.sha1(JSON.stringify(data), secret);
};

exports.removeListener = function removeListener(obj, event, name) {
  const listeners = obj._events[event];
  if (Array.isArray(listeners)) {
    let deleteIndex = null;
    listeners.forEach((listener, index) => {
      if (listener.name === name) {
        deleteIndex = index;
      }
    });
    if (deleteIndex !== null) {
      listeners.splice(deleteIndex, 1);
    }
  }
  if (typeof listeners === 'function') {
    delete obj._events[event];
  }
};

exports.socketCache = new Map();

exports.commandApiEvent = new EventEmitter();
