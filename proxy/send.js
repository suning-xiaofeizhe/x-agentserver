'use strict';

const config = require('../config');
const urllib = require('urllib');
const Agent = require('agentkeepalive');

const keepaliveAgent = new Agent({
  maxSockets: 1000,
  maxFreeSockets: 100,
  timeout: 1200000,
  freeSocketTimeout: 60000
});

module.exports = async function sendMessage(url, method, data) {
  const requestUrl = `${config.agentmanager}${url}`;
  return urllib.request(requestUrl, {
    method,
    data,
    nestedQuerystring: true,
    timeout: 15000,
    agent: keepaliveAgent,
    contentType: 'json'
  });
};
