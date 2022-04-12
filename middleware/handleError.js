'use strict';

const winext = require('winext');
const Promise = winext.require('bluebird');
const chalk = winext.require('chalk');

function handleError(params = {}) {
  const { err, response, requestId, loggerFactory, loggerTracer } = params;

  loggerTracer.info(chalk.green.bold(`Load func handleError successfully!`));
  loggerFactory.error(`Func handleError has error`, { requestId: `${requestId}` });

  if (err instanceof Error) {
    loggerFactory.error(`error has type Error`, {
      requestId: `${requestId}`,
      args: err.name,
    });
    response.status(500).send({
      name: err.name,
      message: err.message,
    });
    return Promise.reject(err);
  } else {
    loggerFactory.error(`error has not type Error`, { requestId: `${requestId}`, args: err });
    const { name, message, statusCode, returnCode } = err;
    response.status(statusCode).set({ 'X-Return-Code': returnCode }).send({
      name: name,
      message: message,
    });
    return Promise.reject(JSON.stringify(err));
  }
}

module.exports = handleError;
