'use strict';

const path = require('path');
const fs = require('fs');
const Logger = require('mini-logger');

const logDir = path.join(__dirname, '../logs');

fs.mkdirSync(logDir, { recursive: true });

module.exports = Logger({
  dir: logDir,
  format: 'YYYY-MM-DD[.log]',
  timestamp: 'YYYY-MM-DD HH:mm:ss.SSS',
  stdout: true
});