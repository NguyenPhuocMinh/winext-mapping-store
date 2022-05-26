'use strict';

const winext = require('winext');
const Promise = winext.require('bluebird');
const lodash = winext.require('lodash');
const handleError = require('./handleError');
const handleTemplate = require('./handleTemplate');
const profiles = require('../conf/profiles');
const { get, isEmpty, isFunction, isNil } = lodash;

function handleMapping(params = {}) {
  const { request, response, input, output, service, logUtils, loggerTracer, messageCodes } = params;

  let argsInput = {};
  let argsOutput = {};

  const opts = {
    logUtils: logUtils,
    loggerTracer: loggerTracer,
  };

  if (input) {
    if (isFunction(input.transform)) {
      argsInput = input.transform(request, opts);
    }
  }

  return new Promise((resolve, reject) => {
    loggerTracer.info(`HandleMapping has been start`);
    resolve(argsInput);
  })
    .then((args) => {
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
          loggerTracer.debug('Data transform no headers and no cookies and no clearCookies');
          response.status(template.statusCode).set({ 'X-Return-Code': 0 }).send(template);
          loggerTracer.info(`HandleMapping has been end`);
          break;
        case isEmpty(headers) && !isEmpty(setCookies) && isEmpty(clearCookies) && !isEmpty(body):
          loggerTracer.debug('Data transform no headers and no clearCookies and have cookie and body');
          for (const key in setCookies) {
            const value = !isEmpty(setCookies[key].value) ? setCookies[key].value : '';
            const options = !isEmpty(setCookies[key].options)
              ? setCookies[key].options
              : {
                  httpOnly: true,
                  secure: profiles.isProduction,
                };
            response.cookie(key, value, options);
          }
          response.status(template.statusCode).set({ 'X-Return-Code': 0 }).send(template);
          loggerTracer.info(`HandleMapping has been end`);
          break;
        case isEmpty(headers) && isEmpty(setCookies) && !isEmpty(clearCookies) && isEmpty(body):
          loggerTracer.debug('data transform no headers and no cookie and have clearCookie');
          for (const key in clearCookies) {
            const options = clearCookies[key].options;
            if (!isEmpty(options)) {
              response.clearCookie(key, options);
            } else {
              response.clearCookie(key);
            }
          }
          response.status(template.statusCode).set({ 'X-Return-Code': 0 }).send(template);
          loggerTracer.info(`HandleMapping has been end`);
          break;
        case isEmpty(headers) && isEmpty(body):
          loggerTracer.debug('Data transform no headers and no body');
          response.status(template.statusCode).set({ 'X-Return-Code': 0 }).send(template);
          loggerTracer.info(`HandleMapping has been end`);
          break;
        default:
          loggerTracer.debug('Data transform have headers and have body');
          headers['X-Return-Code'] = 0;
          response.status(template.statusCode).set(headers).send(template);
          loggerTracer.info(`HandleMapping has been end`);
          break;
      }
    })
    .catch((err) => {
      handleError({ err, request, response, loggerTracer });
    });
}

module.exports = handleMapping;
