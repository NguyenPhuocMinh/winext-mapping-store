'use strict';

const winext = require('winext');
const lodash = winext.require('lodash');
const chalk = winext.require('chalk');
const handleError = require('./handleError');
const { isEmpty, isNil } = lodash;

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
        const data = JSON.parse(reply);
        if (!isNil(data.total)) {
          const headers = {
            'X-Total-Count': data.total,
            'Access-Control-Expose-Headers': 'X-Total-Count',
            'X-Return-Code': 0,
          };
          response.status(200).set(headers).send(data);
        } else {
          response.status(200).set({ 'X-Return-Code': 0 }).send(data);
        }
        await redisClient.disconnect();
        loggerFactory.info(`handleCaching has been end`, {
          requestId: `${requestId}`,
        });
      } else {
        loggerFactory.info(`handleCaching no has data with redisKey`, {
          requestId: `${requestId}`,
          args: redisKey,
        });
        loggerFactory.info(`handleCaching has been end`, {
          requestId: `${requestId}`,
        });
        return next();
      }
    });
  } catch (err) {
    handleError({ err, response, requestId, loggerFactory, loggerTracer });
  }
}

module.exports = handleCaching;
