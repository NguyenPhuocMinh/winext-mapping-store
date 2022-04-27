'use strict';

const winext = require('winext');
const Promise = winext.require('bluebird');
const chalk = winext.require('chalk');

function handleError(params = {}) {
  const { err, request, response, requestId, loggerFactory, loggerTracer } = params;
  const { method, path } = request;

  loggerTracer.info(chalk.green.bold(`Load func handleError successfully!`));

  if (err instanceof Error) {
    loggerFactory.error(`error has type Error`, {
      requestId: `${requestId}`,
      args: { name: err.name, stack: err.stack },
    });
    response.status(500).send({
      data: {},
      method: method,
      endpoint: path,
      name: err.name,
      message: err.message,
      returnCode: 5000,
      statusCode: 500,
    });
    return Promise.reject(err);
  } else {
    loggerFactory.error(`error has not type Error`, { requestId: `${requestId}`, args: err });
    const { name, message, statusCode, returnCode } = err;
    response.status(statusCode).set({ 'X-Return-Code': returnCode }).send({
      data: {},
      method: method,
      endpoint: path,
      name: name,
      message: message,
      returnCode: returnCode,
      statusCode: statusCode,
    });
    return Promise.reject(JSON.stringify(err));
  }
}

module.exports = handleError;
