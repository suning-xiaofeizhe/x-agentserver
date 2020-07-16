'use strict';

const config = require('../config');
const dbConfig = config.mysql;
const rds = require('ali-rds');

module.exports = rds(dbConfig);
