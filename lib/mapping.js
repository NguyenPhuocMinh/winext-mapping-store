'use strict';

const winext = require('winext');
const Promise = winext.require('bluebird');
const lodash = winext.require('lodash');
const handleMapping = require('../middleware/handleMapping');
const handleCaching = require('../middleware/handleCaching');
const { get, isEmpty, isArray, toLower } = lodash;

const options = require('../conf/options');
const profiles = require('../conf/profiles');

function MappingStore(params = {}) {
  const config = get(params, 'config');
  const mappings = get(params, 'mappings', []);
  const repoStore = get(params, 'repoStore');
  const redisStore = get(params, 'redisStore');
  const authorization = get(params, 'authorization');
  const loggerTracer = get(params, 'loggerTracer');
  const logUtils = get(params, 'logUtils');
  const errorManager = get(params, 'errorManager');
  const messageCodes = get(params, 'messageCodes');

  const contextPath = profiles.contextPath || get(config, 'contextPath');

  this.mapping = function (app, router) {
    /**
     *  mappings
     */
    return new Promise((resolve, reject) => {
      if (isEmpty(mappings)) {
        reject(new Error('mapping not found'));
      }
      loggerTracer.info('Router mappings has been start !!!');
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
              if (_dataMongoStore === options.referenceKey.data_mongo_store) {
                serviceParams.dataMongoStore = repoStore.dataMongoStore;
              }
            }
            /**
             * Add dataSequelize to params service
             */
            if (Object.prototype.hasOwnProperty.call(reference, 'dataSequelizeStore')) {
              const _dataSequelizeStore = reference.dataSequelizeStore;
              if (_dataSequelizeStore === options.referenceKey.data_sequelize_store) {
                serviceParams.dataSequelizeStore = repoStore.dataSequelizeStore;
              }
            }
            /**
             * Add dataGraphqlStore to params service
             */
            if (Object.prototype.hasOwnProperty.call(reference, 'dataGraphqlStore')) {
              const _dataGraphqlStore = reference.dataGraphqlStore;
              if (_dataGraphqlStore === options.referenceKey.data_graphql_store) {
                serviceParams.dataGraphqlStore = repoStore.dataGraphqlStore;
              }
            }
            /**
             * Add redisStore to params service
             */
            if (Object.prototype.hasOwnProperty.call(reference, 'redisClient')) {
              const _redisClient = reference.redisClient;
              if (_redisClient === options.referenceKey.redis_client) {
                serviceParams.redisClient = redisStore.redisClient;
              }
            }
            /**
             * Add errorManager to params service
             */
            if (Object.prototype.hasOwnProperty.call(reference, 'errorManager')) {
              const _errorManager = reference.errorManager;
              if (_errorManager === options.referenceKey.error_manager) {
                serviceParams.errorManager = errorManager;
              }
            }

            service.register(serviceParams);
          }
        }

        mappings.map((mapping) => {
          const method = get(mapping, 'method');
          const pathName = get(mapping, 'pathName');
          const serviceName = get(mapping, 'serviceName');
          const methodName = get(mapping, 'methodName');
          const input = get(mapping, 'input') || {};
          const output = get(mapping, 'output') || {};
          const service = serviceName[methodName];

          loggerTracer.data(`Router layer`, {
            args: {
              pathName: pathName,
              method: method,
              methodName: methodName,
            },
          });

          if (isEmpty(method)) {
            loggerTracer.error(`Method not found`, {
              args: method,
            });
            reject(new Error('method not found'));
          }

          app.use(
            contextPath,
            router[toLower(method)](pathName, (request, response, next) =>
              !isEmpty(authorization) ? authorization.noVerifyToken(request, response, next) : next()
            ),
            router[toLower(method)](pathName, (request, response, next) =>
              !isEmpty(authorization) ? authorization.verifyTokenMiddleware(request, response, next) : next()
            ),
            router[toLower(method)](pathName, (request, response, next) =>
              !isEmpty(authorization) ? authorization.publicRouters(request, response, next) : next()
            ),
            router[toLower(method)](pathName, (request, response, next) =>
              !isEmpty(authorization) ? authorization.protectedRouters(request, response, next) : next()
            ),
            router[toLower(method)](pathName, (request, response, next) =>
              handleCaching({
                request,
                response,
                next,
                redisStore,
                logUtils,
                loggerTracer,
                messageCodes,
              })
            ),
            router[toLower(method)](pathName, (request, response, next) =>
              handleMapping({
                request,
                response,
                next,
                input,
                output,
                service,
                logUtils,
                loggerTracer,
                messageCodes,
              })
            )
          );

          return app;
        });
      }
      loggerTracer.info('Router mappings has been complete');
      resolve(app);
    }).catch((err) => {
      loggerTracer.error(`Mapping has error`, {
        args: err,
      });
      return Promise.reject(err);
    });
  };
}

exports = module.exports = new MappingStore();
exports.register = MappingStore;
