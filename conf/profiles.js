'use strict';

const winext = require('winext');
const dotenv = winext.require('dotenv');
dotenv.config();

const isProduction = process.env.NODE_ENV === 'production';

const contextPath = process.env.CONTEXT_PATH;

const profiles = {
  isProduction,
  contextPath,
};

module.exports = profiles;
