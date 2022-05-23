'use strict';

const referenceKey = {
  data_mongo_store: 'app-repo-store/dataMongoStore',
  data_sequelize_store: 'app-repo-store/dataSequelizeStore',
  data_graphql_store: 'app-repo-store/dataGraphqlStore',
  redis_client: 'app-redis-store/redisClient',
  error_manager: 'app-error-manager/errorManager',
};

const options = {
  referenceKey,
};

module.exports = options;
