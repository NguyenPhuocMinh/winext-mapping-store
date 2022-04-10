'use strict';

const winext = require('winext');
const Promise = winext.require('bluebird');
const lodash = winext.require('lodash');
const dotenv = winext.require('dotenv');
const chalk = winext.require('chalk');
const handleMapping = require('../middleware/handleMapping');
const { get, isEmpty, isArray, toLower } = lodash;
const { name, version } = require('../package.json');

function MappingStore(params = {}) {
  // config env
  dotenv.config();

  const config = get(params, 'config');
  const mappings = get(params, 'mappings', []);
  const requestId = get(params, 'requestId');
  const repoStore = get(params, 'repoStore');
  const redisStore = get(params, 'redisStore');
  const authorization = get(params, 'authorization');
  const loggerFactory = get(params, 'loggerFactory');
  const loggerTracer = get(params, 'loggerTracer');
  const errorManager = get(params, 'errorManager');

  const contextPath = process.env.CONTEXT_PATH || get(config, 'contextPath');

  this.mapping = async function (app, router) {
    loggerTracer.info(chalk.green.bold(`Load mapping by ${name}-${version} successfully!`));
    loggerFactory.info(`Mapping has been start`, {
      requestId: `${requestId}`,
    });
    /**
     * check TokenMiddleware
     */
    if (!isEmpty(authorization)) {
      app.use(
        contextPath,
        authorization.noVerifyToken,
        authorization.verifyTokenMiddleware,
        authorization.publicRouters,
        authorization.protectedRouters
      );
    }
    /**
     *  mappings
     */
    return new Promise((resolve, reject) => {
      if (isEmpty(mappings)) {
        reject(new Error('mapping not found'));
      }
      if (!isEmpty(mappings) && isArray(mappings)) {
        for (let i = 0; i < mappings.length; i++) {
          const serviceParams = {};
          const service = get(mappings[i], 'serviceName');

          if (Object.prototype.hasOwnProperty.call(service.register, 'reference')) {
            const reference = service.register.reference;
            /**
             * Add dataStore to params service
             */
            if (Object.prototype.hasOwnProperty.call(reference, 'dataMongoStore')) {
              const _dataMongoStore = reference.dataMongoStore;
              if (_dataMongoStore === 'app-repo-store/dataMongoStore') {
                serviceParams.dataMongoStore = repoStore.dataMongoStore;
              }
            }
            /**
             * Add dataSequelize to params service
             */
            if (Object.prototype.hasOwnProperty.call(reference, 'dataSequelizeStore')) {
              const _dataSequelizeStore = reference.dataSequelizeStore;
              if (_dataSequelizeStore === 'app-repo-store/dataSequelizeStore') {
                serviceParams.dataSequelizeStore = repoStore.dataSequelizeStore;
              }
            }
            /**
             * Add redisStore to params service
             */
            if (Object.prototype.hasOwnProperty.call(reference, 'redisClient')) {
              const _redisClient = reference.redisClient;
              if (_redisClient === 'app-redis-store/redisClient') {
                serviceParams.redisClient = redisStore.redisClient;
              }
            }
            /**
             * Add errorManager to params service
             */
            if (Object.prototype.hasOwnProperty.call(reference, 'errorManager')) {
              const _errorManager = reference.errorManager;
              if (_errorManager === 'app-error-manager/errorManager') {
                serviceParams.errorManager = errorManager;
              }
            }

            service.register(serviceParams);
          }
        }

        return mappings.map((mapping) => {
          const method = get(mapping, 'method');
          const pathName = get(mapping, 'pathName');
          const serviceName = get(mapping, 'serviceName');
          const methodName = get(mapping, 'methodName');
          const input = get(mapping, 'input') || {};
          const output = get(mapping, 'output') || {};
          const service = serviceName[methodName];

          if (isEmpty(method)) {
            loggerFactory.error(`Method not found`, {
              requestId: `${requestId}`,
              args: method,
            });
            reject(new Error('method not found'));
          }

          app.use(
            contextPath,
            router[toLower(method)](pathName, (request, response, next) =>
              handleMapping({
                request,
                response,
                input,
                output,
                service,
                requestId,
                loggerFactory,
                loggerTracer,
              })
            )
          );

          return app;
        });
      }
      resolve(app);
    })
      .then((info) => {
        loggerFactory.info(`Router mapping has complete`, {
          requestId: `${requestId}`,
        });

        return info;
      })
      .catch((err) => {
        loggerFactory.error(`Mapping has error: ${err}`, {
          requestId: `${requestId}`,
          args: err,
        });
        return Promise.reject(err);
      });
  };
}

exports = module.exports = new MappingStore();
exports.register = MappingStore;
