'use strict';

const winext = require('winext');
const lodash = winext.require('lodash');
const { isEmpty } = lodash;

function handleCache(request, response, next) {
  console.log('🚀 ~ file: handleCache.js ~ line 8 ~ handleCache ~ response', response);
  console.log('🚀 ~ file: handleCache.js ~ line 8 ~ handleCache ~ request', request);
}

module.exports = handleCache;
