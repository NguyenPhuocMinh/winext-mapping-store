'use strict';

const winext = require('winext');
const Promise = winext.require('bluebird');
const lodash = winext.require('lodash');
const chalk = winext.require('chalk');
const handleError = require('./handleError');
const handleTemplate = require('./handleTemplate');
const { get, isEmpty, isFunction, isNil } = lodash;

function handleMapping(params = {}) {
  const { request, response, input, output, service, loggerFactory, loggerTracer, messageCodes } = params;

  loggerTracer.info(chalk.green.bold(`Load func handleMapping successfully!`));

  let argsInput = {};
  let argsOutput = {};

  const opts = {
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
      const setCookies = get(data, 'setCookies');
      const clearCookies = get(data, 'clearCookies');
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
        case isEmpty(headers) && isEmpty(setCookies) && isEmpty(clearCookies) && !isEmpty(body):
          loggerFactory.warn('data transform no headers and no cookies and no clearCookies');
          return response.status(template.statusCode).set({ 'X-Return-Code': 0 }).send(template);
        case isEmpty(headers) && !isEmpty(setCookies) && isEmpty(clearCookies) && !isEmpty(body):
          loggerFactory.warn('data transform no headers and no clearCookies and have cookie and body');
          for (const key in setCookies) {
            const value = !isEmpty(setCookies[key].value) ? setCookies[key].value : '';
            const options = !isEmpty(setCookies[key].options)
              ? setCookies[key].options
              : {
                  httpOnly: true,
                  secure: process.env.NODE_ENV === 'production',
                };
            response.cookie(key, value, options);
          }
          return response.status(template.statusCode).set({ 'X-Return-Code': 0 }).send(template);
        case isEmpty(headers) && isEmpty(setCookies) && !isEmpty(clearCookies) && isEmpty(body):
          loggerFactory.warn('data transform no headers and no cookie and have clearCookie');
          for (const key in clearCookies) {
            const options = clearCookies[key].options;
            if (!isEmpty(options)) {
              response.clearCookie(key, options);
            } else {
              response.clearCookie(key);
            }
          }
          return response.status(template.statusCode).set({ 'X-Return-Code': 0 }).send(template);
        default:
          loggerFactory.warn('data transform have headers and have body');
          headers['X-Return-Code'] = 0;
          return response.status(template.statusCode).set(headers).send(template);
      }
    })
    .catch((err) => {
      handleError({ err, request, response, loggerFactory, loggerTracer });
    });
}

module.exports = handleMapping;
