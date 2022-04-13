'use strict';

const winext = require('winext');
const lodash = winext.require('lodash');
const chalk = winext.require('chalk');
const handleError = require('./handleError');
const { isEmpty } = lodash;

const handleCaching = async (params = {}) => {
  const { request, response, next, requestId, loggerFactory, loggerTracer, redisStore } = params;

  try {
    loggerTracer.info(chalk.green.bold(`Load func handleCaching successfully!`));

    const redisClient = redisStore.redisClient;
    const path = request.path;

    const data = await redisClient.getOne({ key: path });

    if (!isEmpty(data)) {
      loggerFactory.warn('has data from redis store with key', {
        requestId: requestId,
        args: path,
      });
      return response.status(200).set({ 'X-Return-Code': 0 }).send(data);
    } else {
      loggerFactory.warn('no has data from redis store with key', {
        requestId: requestId,
        args: path,
      });
      return next();
    }
  } catch (err) {
    handleError({ err, response, requestId, loggerFactory, loggerTracer });
  }
};

module.exports = handleCaching;
