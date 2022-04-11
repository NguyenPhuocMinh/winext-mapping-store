'use strict';

const winext = require('winext');
const chalk = winext.require('chalk');
const lodash = winext.require('lodash');
const { isEmpty } = lodash;

async function handleCache(params = {}) {
  const { request, response, next, body, redisClient, requestId, loggerFactory, loggerTracer } = params;

  loggerTracer.debug(chalk.blue.bold(`Func handleCache has been start`));

  await redisClient.setSetex({ key: request.path, seconds: 3600, value: JSON.stringify(body) });

  if (request.method === 'GET') {
    loggerFactory.debug('method GET caching data', { requestId: requestId });
    const dataFromRedis = await redisClient.getOne({ key: request.path });
    if (!isEmpty(dataFromRedis)) {
      loggerFactory.debug('method GET have data from redis store', { requestId: requestId });
      return response.status(200).set({ 'X-Return-Code': 0 }).send(dataFromRedis);
    } else {
      loggerFactory.debug('method GET no have data from redis store', { requestId: requestId });
      return response.status(200).set({ 'X-Return-Code': 0 }).send(body);
    }
  } else {
    loggerFactory.debug('Not method GET', { requestId: requestId });
    return next();
  }
}

module.exports = handleCache;
