'use strict';

const winext = require('winext');
const lodash = winext.require('lodash');
const handleError = require('./handleError');
const handleTemplate = require('./handleTemplate');
const { get, isEmpty, isNil } = lodash;

async function handleCaching(params = {}) {
  const { request, response, next, redisStore, logUtils, loggerTracer, messageCodes } = params;

  const opts = {
    logUtils: logUtils,
    loggerTracer: loggerTracer,
  };

  const redisClient = redisStore.redisClient;
  const redisKey = request.path;

  try {
    loggerTracer.info(`handleCaching has been start`);
    await redisClient.connect().catch((_) => {}); // fix connect redis v4

    await redisClient.get(redisKey, async (err, reply) => {
      if (err) {
        loggerTracer.error(`redis get data has err with redisKey`, {
          args: {
            redisKey: redisKey,
            err: err,
          },
        });
      }
      if (!isEmpty(reply)) {
        loggerTracer.debug(`handleCaching has data with redisKey`, {
          args: redisKey,
        });

        let template;
        const body = {};
        const data = JSON.parse(reply);
        const message = get(data, 'message');

        body.result = data.result;

        if (!isNil(data.total)) {
          loggerTracer.debug(`handleCaching has data and total with redisKey`, {
            args: {
              redisKey: redisKey,
              total: data.total,
            },
          });

          body.total = data.total;

          template = handleTemplate({ request, opts, body, message, messageCodes });

          const headers = {
            'X-Total-Count': data.total,
            'Access-Control-Expose-Headers': 'X-Total-Count',
            'X-Return-Code': 0,
          };
          response.status(template.statusCode).set(headers).send(template);
        } else {
          loggerTracer.debug(`handleCaching has data and no total with redisKey`, {
            args: {
              redisKey: redisKey,
            },
          });
          template = handleTemplate({ request, opts, body, message, messageCodes });
          response.status(template.statusCode).set({ 'X-Return-Code': 0 }).send(template);
        }
        await redisClient.disconnect();
        loggerTracer.info(`handleCaching has been end`);
      } else {
        loggerTracer.debug(`handleCaching no has data with redisKey`, {
          args: redisKey,
        });
        loggerTracer.info(`handleCaching has been end`);
        return next();
      }
    });
  } catch (err) {
    handleError({ err, request, response, loggerTracer });
  }
}

module.exports = handleCaching;
