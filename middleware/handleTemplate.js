'use strict';

const winext = require('winext');
const chalk = winext.require('chalk');
const lodash = winext.require('lodash');
const { isEmpty } = lodash;

const handleTemplate = (params = {}) => {
  const { request, opts = {}, body, message, messageCodes } = params;
  const { requestId, loggerFactory, loggerTracer } = opts;

  loggerTracer.info(chalk.green.bold(`Load func handleTemplate successfully!`));

  const { path, method } = request;

  const template = {};

  loggerFactory.warn('Func handleTemplate has been start', { requestId: requestId });

  if (Object.prototype.hasOwnProperty.call(messageCodes, message)) {
    loggerFactory.warn('Message hasOwnProperty in messageCodes', {
      requestId: requestId,
      args: message,
    });
    template.data = !isEmpty(body) ? body : {};
    template.method = method;
    template.endpoint = path;
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
    template.endpoint = path;
    template.name = message;
    template.message = `Message name [${message}] not supported`;
    template.returnCode = 1000;
    template.statusCode = 400;
  }

  loggerFactory.warn('Func handleTemplate has been end', { requestId: requestId });

  return template;
};

module.exports = handleTemplate;
