'use strict';

const winext = require('winext');
const lodash = winext.require('lodash');
const { isEmpty } = lodash;

const handleTemplate = (params = {}) => {
  const { request, opts = {}, body, message, messageCodes } = params;
  const { loggerTracer } = opts;

  const { path, method } = request;

  const template = {};

  loggerTracer.warn('Func handleTemplate has been start');

  if (Object.prototype.hasOwnProperty.call(messageCodes, message)) {
    loggerTracer.warn('Message hasOwnProperty in messageCodes', {
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
    loggerTracer.warn('Message not hasOwnProperty in messageCodes', {
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

  loggerTracer.warn('Func handleTemplate has been end');

  return template;
};

module.exports = handleTemplate;
