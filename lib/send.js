'use strict';

const config = require('../config');
const address = require('address');
const sendMessage = require('../proxy/send');

exports.sendHeartbeatMessage = async function sendHeartbeatMessage(appId, agentId, timestamp) {
  const res = await sendMessage('/api/agentserver/heartbeat', 'POST',
    { appId, agentId, timestamp, ip: `${address.ip()}:${config.webPort}` });
  return res;
};

exports.sendAgentCloseMessage = async function sendAgentCloseMessage(agentKey) {
  const tmp = agentKey.split('::');
  const appId = tmp[0];
  const agentId = tmp[1];
  const res = await sendMessage('/api/agentserver/agent_close', 'POST',
    { appId, agentId });
  return res;
};

exports.sendLogMessage = async function sendNodeLogMessage(log, appId, agentId, timestamp) {
  const res = await sendMessage('/api/agentserver/log', 'POST',
    { log, appId, agentId, timestamp });
  return res;
};
