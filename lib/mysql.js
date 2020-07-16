'use strict';

const client = require('../proxy/mysql');

exports.getAppKey = function (appId) {
  const sql = 'SELECT secret FROM apps WHERE id = ?';
  const params = [appId];
  return client.query(sql, params).then(data => data[0] && data[0].secret);
};
