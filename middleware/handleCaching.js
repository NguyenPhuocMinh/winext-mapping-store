'use strict';

const winext = require('winext');
const lodash = winext.require('lodash');
const chalk = winext.require('chalk');
const handleError = require('./handleError');
const { isEmpty } = lodash;

async function handleCaching(params = {}) {
  const { request, response, next, redisStore, requestId, loggerFactory, loggerTracer } = params;

  loggerTracer.info(chalk.green.bold(`Load func handleCaching successfully!`));

  const redisClient = redisStore.redisClient;
  const redisKey = request.path;

  try {
    loggerFactory.info(`handleCaching has been start`, {
      requestId: `${requestId}`,
    });
    await redisClient.connect().catch((_) => {}); // fix connect redis v4

    await redisClient.get(redisKey, async (err, reply) => {
      if (err) {
        loggerFactory.error(`redis get data has err with redisKey`, {
          requestId: `${requestId}`,
          args: {
            redisKey: redisKey,
            err: err,
          },
        });
      }
      if (!isEmpty(reply)) {
        loggerFactory.info(`handleCaching has data with redisKey`, {
          requestId: `${requestId}`,
          args: redisKey,
        });
        response.status(200).send(JSON.parse(reply));
        await redisClient.disconnect();
      } else {
        loggerFactory.info(`handleCaching no has data with redisKey`, {
          requestId: `${requestId}`,
          args: redisKey,
        });
        return next();
      }
    });
    loggerFactory.info(`handleCaching has been end`, {
      requestId: `${requestId}`,
    });
  } catch (err) {
    handleError({ err, response, requestId, loggerFactory, loggerTracer });
  }
}

module.exports = handleCaching;
