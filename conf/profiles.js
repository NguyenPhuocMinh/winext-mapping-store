'use strict';

const winext = require('winext');
const dotenv = winext.require('dotenv');
dotenv.config();

const contextPath = process.env.CONTEXT_PATH;

const profiles = {
  contextPath,
};

module.exports = profiles;
