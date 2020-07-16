'use strict';

const uuid = require('uuid/v4');
const utils = require('../lib/utils');

const socketCache = utils.socketCache;
const commandApiEvent = utils.commandApiEvent;

function sendCommandToXAgent(socket, secret, params, timeout = 5000) {
  const traceId = uuid();
  const data = { type: 'command', params, traceId };
  data.signature = utils.signature(data, secret);
  socket.send(JSON.stringify(data));
  return Promise.race([
    new Promise(resolve => commandApiEvent.once(traceId, resolve)),
    new Promise(resolve => setTimeout(resolve, timeout))
  ]);
}

exports.checkAlive = async function (ctx) {
  const post = ctx.request.body;
  const data = [];
  if (Array.isArray(post.agentIdList)) {
    for (let agent of post.agentIdList) {
      data.push({
        agentKey: agent,
        alive: socketCache.has(agent)
      });
    }
  }
  ctx.body = { ok: true, data };
};

exports.execCommand = async function (ctx) {
  const post = ctx.request.body;
  const agentKey = post.agentKey;
  const socket = socketCache.get(agentKey);
  const secret = post.secret;
  const command = post.command;
  let timeout = post.timeout || 5;
  timeout = timeout * 1000;
  if (!socket) {
    ctx.body = { ok: false, message: `agent [${agentKey}] not connected!` };
    return;
  }
  ctx.body = await sendCommandToXAgent(socket, secret, { command, timeout }, timeout);
};
