/**
 * Shared "stuff" (mostly globals to shim around Node's shortcomings);
 * use this for bin files that need access to app modules.
 */
const NODE_ENV = process.env.NODE_ENV || 'development';
const _ = require('lodash');
const path = require('path');
const configData = require(`../config/${NODE_ENV}.json`);

// ditch dumb relative loading paths
global.ACQUIRE = function(modulePath) {
  if (modulePath.indexOf('#') === 0) {
    return require(path.join(__dirname, `./${modulePath.slice(2)}`));
  }
  return require(modulePath);
};

// fetch a config value
global.FETCH_CONFIG = function(query, defaultValue = null) {
  return _.get(configData, query, defaultValue);
};
