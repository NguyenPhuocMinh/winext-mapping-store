'use strict';

const winext = require('winext');
const chalk = winext.require('chalk');

const handleTemplate = (params = {}) => {
  const { request, opts = {}, body, message, messageCodes, contextPath } = params;
  const { requestId, loggerFactory, loggerTracer } = opts;

  loggerTracer.info(chalk.green.bold(`Load func handleTemplate successfully!`));

  const { path, method } = request;

  const endpoint = `${contextPath}${path}`;

  const template = {};

  loggerFactory.warn('Func handleTemplate has been start', { requestId: requestId });

  if (Object.prototype.hasOwnProperty.call(messageCodes, message)) {
    loggerFactory.warn('Message hasOwnProperty in messageCodes', {
      requestId: requestId,
      args: message,
    });
    template.data = body;
    template.method = method;
    template.endpoint = endpoint;
    template.name = message;
    template.message = messageCodes[message].message;
    template.returnCode = messageCodes[message].returnCode;
    template.statusCode = messageCodes[message].statusCode;
  } else {
    loggerFactory.warn('Message not hasOwnProperty in messageCodes', {
      requestId: requestId,
      args: message,
    });
    template.data = {};
    template.method = method;
    template.endpoint = endpoint;
    template.name = message;
    template.message = `Message name [${message}] not supported`;
    template.returnCode = 1000;
    template.statusCode = 400;
  }

  loggerFactory.warn('Func handleTemplate has been end', { requestId: requestId });

  return template;
};

module.exports = handleTemplate;
