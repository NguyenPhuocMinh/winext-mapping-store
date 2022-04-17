'use strict';

const winext = require('winext');
const lodash = winext.require('lodash');
const chalk = winext.require('chalk');
const handleError = require('./handleError');
const handleTemplate = require('./handleTemplate');
const { get, isEmpty, isNil } = lodash;

async function handleCaching(params = {}) {
  const { request, response, next, redisStore, requestId, loggerFactory, loggerTracer, messageCodes, contextPath } =
    params;

  const opts = {
    requestId: requestId,
    loggerFactory: loggerFactory,
    loggerTracer: loggerTracer,
  };

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
        loggerFactory.warn(`handleCaching has data with redisKey`, {
          requestId: `${requestId}`,
          args: redisKey,
        });

        let template;
        const body = {};
        const data = JSON.parse(reply);
        const message = get(data, 'message');

        body.result = data.result;

        if (!isNil(data.total)) {
          loggerFactory.warn(`handleCaching has data and total with redisKey`, {
            requestId: `${requestId}`,
            args: {
              redisKey: redisKey,
              total: data.total,
            },
          });

          body.total = data.total;

          template = handleTemplate({ request, opts, body, message, messageCodes, contextPath });

          const headers = {
            'X-Total-Count': data.total,
            'Access-Control-Expose-Headers': 'X-Total-Count',
            'X-Return-Code': 0,
          };
          response.status(template.statusCode).set(headers).send(template);
        } else {
          loggerFactory.warn(`handleCaching has data and no total with redisKey`, {
            requestId: `${requestId}`,
            args: {
              redisKey: redisKey,
            },
          });
          template = handleTemplate({ request, opts, body, message, messageCodes, contextPath });
          response.status(template.statusCode).set({ 'X-Return-Code': 0 }).send(template);
        }
        await redisClient.disconnect();
        loggerFactory.warn(`handleCaching has been end`, {
          requestId: `${requestId}`,
        });
      } else {
        loggerFactory.warn(`handleCaching no has data with redisKey`, {
          requestId: `${requestId}`,
          args: redisKey,
        });
        loggerFactory.warn(`handleCaching has been end`, {
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
