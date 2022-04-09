'use strict';

const winext = require('winext');
const Promise = winext.require('bluebird');
const lodash = winext.require('lodash');
const chalk = winext.require('chalk');
const handleError = require('./handleError');
const { get, isEmpty, isFunction } = lodash;

function handleMapping(params = {}) {
  const {
    request,
    response,
    input,
    output,
    service,
    requestId,
    loggerFactory,
    loggerTracer
  } = params;

  let argsInput = {};
  let argsOutput = {};

  const opts = {
    requestId: requestId,
    loggerFactory: loggerFactory,
    loggerTracer: loggerTracer
  };

  if (input) {
    if (isFunction(input.transform)) {
      argsInput = input.transform(request, opts);
    }
  }

  return new Promise((resolve, reject) => {
    resolve(argsInput);
  })
    .then(args => {
      loggerTracer.warn(chalk.yellow(`args service: ${JSON.stringify(args)}`));
      return service(args, opts);
    })
    .then(result => {
      if (output) {
        if (isFunction(output.transform)) {
          argsOutput = output.transform(result);
        } else {
          argsOutput = result;
        }
      }
      return argsOutput;
    })
    .then(data => {
      const headers = get(data, 'headers');
      const body = get(data, 'body');

      if (isEmpty(headers) && !isEmpty(body)) {
        loggerFactory.warn('data transform no headers and have body', { requestId: requestId });
        return response.status(200).set({ 'X-Return-Code': 0 }).send(body);
      } else if (isEmpty(headers) && isEmpty(body)) {
        loggerFactory.warn('data transform no headers and no body', { requestId: requestId });
        return response.status(200).set({ 'X-Return-Code': 0 }).send(data);
      } else {
        loggerFactory.warn('data transform have headers and have body', { requestId: requestId });
        headers['X-Return-Code'] = 0;
        return response.status(200).set(headers).send(body);
      }
    })
    .catch(err => {
      handleError({ err, response, requestId, loggerFactory, loggerTracer });
    });
}

module.exports = handleMapping;
