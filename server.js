'use strict';

const Koa = require('koa');
const Router = require('koa-router');
const router = new Router();
const bodyParser = require('koa-bodyparser');

const config = require('./config');
const api = require('./controller/api');

const app = new Koa({ proxy: config.proxy });

app.use(bodyParser());

router.post('/api/check_alive', api.checkAlive);

router.post('/api/exec_command', api.execCommand);

app
  .use(router.routes())
  .use(router.allowedMethods());

module.exports = app;