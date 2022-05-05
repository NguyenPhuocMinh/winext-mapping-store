'use strict';

const winext = require('winext');
const Promise = winext.require('bluebird');
const lodash = winext.require('lodash');
const chalk = winext.require('chalk');
const handleError = require('./handleError');
const handleTemplate = require('./handleTemplate');
const { get, isEmpty, isFunction, isNil } = lodash;

function handleMapping(params = {}) {
  const { request, response, input, output, service, requestId, loggerFactory, loggerTracer, messageCodes } = params;

  loggerTracer.info(chalk.green.bold(`Load func handleMapping successfully!`));

  let argsInput = {};
  let argsOutput = {};

  const opts = {
    requestId: requestId,
    loggerFactory: loggerFactory,
    loggerTracer: loggerTracer,
  };

  if (input) {
    if (isFunction(input.transform)) {
      argsInput = input.transform(request, opts);
    }
  }

  return new Promise((resolve, reject) => {
    resolve(argsInput);
  })
    .then((args) => {
      loggerTracer.warn(chalk.yellow.bold(`args service: ${JSON.stringify(args)}`));
      return service(args, opts);
    })
    .then((result) => {
      if (output) {
        if (isFunction(output.transform)) {
          argsOutput = output.transform(result);
        } else {
          argsOutput = result;
        }
      }
      return argsOutput;
    })
    .then(async (data) => {
      const headers = get(data, 'headers');
      const cookies = get(data, 'cookies');
      const body = get(data, 'body');
      const message = get(data, 'message');

      const result = get(body, 'result');
      const total = get(body, 'total');

      const dataBody = {
        result: result,
      };

      if (!isNil(total)) {
        dataBody.total = total;
      }

      const template = handleTemplate({
        request,
        opts,
        body: dataBody,
        message,
        messageCodes,
      });

      switch (true) {
        case isEmpty(headers) && isEmpty(cookies):
          loggerFactory.warn('data transform no headers and no cookies', { requestId: requestId });
          return response.status(template.statusCode).set({ 'X-Return-Code': 0 }).send(template);
        case isEmpty(headers) && !isEmpty(cookies) && !isEmpty(body):
          loggerFactory.warn('data transform no headers and have cookie and body', { requestId: requestId });
          return response
            .cookie('X-Access-Token', cookies['X-Access-Token'], {
              maxAge: 86400,
              httpOnly: true,
              secure: process.env.NODE_ENV === 'production',
            })
            .status(template.statusCode)
            .set({ 'X-Return-Code': 0 })
            .send(template);
        default:
          loggerFactory.warn('data transform have headers and have body', { requestId: requestId });
          headers['X-Return-Code'] = 0;
          return response.status(template.statusCode).set(headers).send(template);
      }
    })
    .catch((err) => {
      handleError({ err, request, response, requestId, loggerFactory, loggerTracer });
    });
}

module.exports = handleMapping;
