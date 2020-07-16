'use strict';

const fs = require('fs');
const path = require('path');

// get default config
const defaultConfigFile = path.join(__dirname, 'config.default.js');
const defaultConfig = require(defaultConfigFile);

// get env config, eg: config.sit.js
let envConfig = {};
const envFile = path.join(__dirname, 'env');
if (fs.existsSync(envFile)) {
  const env = fs.readFileSync(envFile, 'utf8').trim();
  const envConfigFile = path.join(__dirname, `config.${env}.js`);
  if (fs.existsSync(envConfigFile)) {
    envConfig = require(envConfigFile);
  }
}

module.exports = Object.assign({}, defaultConfig, envConfig);