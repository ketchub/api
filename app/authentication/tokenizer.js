const _ = ACQUIRE('lodash');
const jsonWebToken = ACQUIRE('jsonwebtoken');
const algorithm = FETCH_CONFIG('authentication.algorithm');
const issuer = FETCH_CONFIG('authentication.issuer');
const scopes = FETCH_CONFIG('authentication.scopes');
const SECRET = FETCH_CONFIG('authentication.secret');

module.exports = tokenizer;

function tokenizer( scope, data ) {
  // const dataWithScope = _.merge({sub:scope}, {accountId: data.id});
  const dataWithScope = _.merge({sub:scope}, data);

  return jsonWebToken.sign(
    // scope is a public claim
    dataWithScope,
    // the uh... the secret
    SECRET,
    // the "signature": {algorithm:'', issuer:'', audience:'', expiresIn:''}
    _.merge({algorithm, issuer}, scopes[scope])
  );
};

// Constants (kind of)
tokenizer.SCOPES = {
  WEBUI:    'WEBUI',
  IOS:      'IOS',
  ANDROID:  'ANDROID',
  API:      'API'
};
