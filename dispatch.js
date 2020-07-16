'use strict';

const http = require('http');
const WebSocket = require('ws');
const config = require('./config');
const utils = require('./lib/utils');
const mysql = require('./lib/mysql');
const send = require('./lib/send');
const logger = require('./proxy/logger');

const server = http.createServer();
const wss = new WebSocket.Server({ server });
// cache ws
const XNODE_AGENT_KEY = Symbol('XNODE::AGENT_ID');
const socketCache = utils.socketCache;
const commandApiEvent = utils.commandApiEvent;

wss.on('connection', async function connection(ws) {

  function sendShutDownResponse(params, socket) {
    const data = { type: 'shutdown', params };
    if (socket) {
      socket.send(JSON.stringify(data));
    } else {
      ws.send(JSON.stringify(data));
    }
  }

  function sendResultsResponse(traceId, params, secret) {
    const data = { type: 'result', params, traceId };
    data.signature = utils.signature(data, secret);
    ws.send(JSON.stringify(data));
  }

  function onClose() {
    const agentKey = ws[XNODE_AGENT_KEY];
    logger.error(`client ${agentKey} closed.`);
    if (agentKey) {
      send.sendAgentCloseMessage(agentKey);
      socketCache.delete(agentKey);
    }
  }

  async function onMessage(message) {
    // console.log('received: %s', message);
    message = JSON.parse(message);

    // get app id
    const appId = message.appId || message.appid;
    if (!appId) {
      logger.error('x-agent message should have appId!');
      sendShutDownResponse({ message: 'need appId' });
      return;
    }

    // get app secret
    const secret = await mysql.getAppKey(appId);
    if (!secret) {
      logger.error(`app: ${appId} not exists!`);
      sendShutDownResponse({ message: 'app not exists' });
      return;
    }

    // check signature
    const signature = message.signature;
    delete message.signature;
    if (signature !== utils.sha1(JSON.stringify(message), secret)) {
      logger.error(`app: ${appId} signature error!`);
      sendShutDownResponse({ message: 'signature error' });
      return;
    }

    // handle message
    const type = message.type;
    const traceId = message.traceId;
    const agentId = message.agentId;
    const agentKey = `${appId}::${agentId}`;
    let params;
    try {
      switch (type) {
      case 'register': {
        const oldSocket = socketCache.get(agentKey);
        if (oldSocket && oldSocket !== ws) {
          logger.error(`[${agentKey}] new client connected, old socket will be closed.`);
          utils.removeListener(oldSocket, 'close', 'onClose');
          utils.removeListener(oldSocket, 'message', 'onMessage');
          sendShutDownResponse({ message: 'new socket connected' }, oldSocket);
          socketCache.delete(agentKey);
        }
        socketCache.set(agentKey, ws);
        ws[XNODE_AGENT_KEY] = agentKey;
        params = { ok: true, result: 'REG_OK' };
        sendResultsResponse(traceId, params, secret);
        await send.sendHeartbeatMessage(appId, agentId, message.timestamp);
        break;
      }
      case 'heartbeat':
        socketCache.set(agentKey, ws);
        ws[XNODE_AGENT_KEY] = agentKey;
        params = { ok: true, result: 'HEARTBEAT_ACK' };
        sendResultsResponse(traceId, params, secret);
        await send.sendHeartbeatMessage(appId, agentId, message.timestamp);
        break;
      case 'log': {
        const res = await send.sendLogMessage(message.params, appId, agentId, message.timestamp);
        params = { ok: true, data: res.data && res.data.toString() };
        sendResultsResponse(traceId, params, secret);
        break;
      }
      case 'result':
        commandApiEvent.emit(traceId, message.params);
        break;
      default:
        sendResultsResponse(traceId, { ok: false, message: `not support type ${type}` }, secret);
        break;
      }
    } catch (err) {
      const error = `handle xagent message error: ${err}`;
      logger.error(err);
      if (type === 'register') {
        sendShutDownResponse({ message: error });
      } else {
        sendResultsResponse(traceId, { ok: false, message: error }, secret);
      }
    }
  }

  ws.on('message', onMessage);
  ws.on('close', onClose);
});

server.on('error', err => {
  logger.error('server error:', err);
});

server.listen(config.wsPort);

// web api server
require('./server').listen(config.webPort);