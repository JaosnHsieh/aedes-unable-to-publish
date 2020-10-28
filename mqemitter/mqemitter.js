'use strict';

const { Qlobber } = require('qlobber');
const assert = require('assert');
const fastparallel = require('fastparallel');

function MQEmitter(opts) {
  if (!(this instanceof MQEmitter)) {
    return new MQEmitter(opts);
  }

  const that = this;

  opts = opts || {};
  opts.matchEmptyLevels =
    opts.matchEmptyLevels === undefined ? true : !!opts.matchEmptyLevels;
  opts.separator = opts.separator || '/';
  opts.wildcardOne = opts.wildcardOne || '+';
  opts.wildcardSome = opts.wildcardSome || '#';

  this._messageQueue = [];
  this._messageCallbacks = [];
  this._parallel = fastparallel({
    results: false,
    released,
  });
  setInterval(() => {
    console.log(
      `$ mqemitter/mqemitter.js this._messageCallbacks.length`,
      this._messageCallbacks.length,
    );
  }, 1000);

  this.concurrency = opts.concurrency || 0;

  this.current = 0;
  this._matcher = new Qlobber({
    match_empty_levels: opts.matchEmptyLevels,
    separator: opts.separator,
    wildcard_one: opts.wildcardOne,
    wildcard_some: opts.wildcardSome,
  });

  this.closed = false;
  this._released = released;

  function released() {
    that.current--;

    const message = that._messageQueue.shift();
    const callback = that._messageCallbacks.shift();

    if (message) {
      that._do(message, callback);
    }
  }
}

Object.defineProperty(MQEmitter.prototype, 'length', {
  get: function () {
    return this._messageQueue.length;
  },
  enumerable: true,
});

MQEmitter.prototype.on = function on(topic, notify, done) {
  assert(topic);
  assert(notify);
  this._matcher.add(topic, notify);

  if (done) {
    setImmediate(done);
  }

  return this;
};

MQEmitter.prototype.removeListener = function removeListener(
  topic,
  notify,
  done,
) {
  assert(topic);
  assert(notify);
  this._matcher.remove(topic, notify);

  if (done) {
    setImmediate(done);
  }

  return this;
};

MQEmitter.prototype.emit = function emit(message, cb) {
  assert(message);

  cb = cb || noop;

  if (this.closed) {
    return cb(new Error('mqemitter is closed'));
  }

  if (this.concurrency > 0 && this.current >= this.concurrency) {
    this._messageQueue.push(message);
    this._messageCallbacks.push(cb);
  } else {
    this._do(message, cb);
  }

  return this;
};

MQEmitter.prototype.close = function close(cb) {
  this.closed = true;
  setImmediate(cb);

  return this;
};

MQEmitter.prototype._do = function (message, callback) {
  const matches = this._matcher.match(message.topic);

  this.current++;
  this._parallel(this, matches, message, callback);

  return this;
};

function noop() {}

module.exports = MQEmitter;
