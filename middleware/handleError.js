'use strict';

const winext = require('winext');
const Promise = winext.require('bluebird');

function handleError(params = {}) {
  const { err, request, response, loggerTracer } = params;
  const { method, path } = request;

  if (err instanceof Error) {
    loggerTracer.error(`error has type Error`, {
      args: {
        name: err.name,
        stack: err.stack,
      },
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
    loggerTracer.error(`error has not type Error`, {
      args: err,
    });
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
