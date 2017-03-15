require('mocha');
const _       = require('lodash');
const chai    = require('chai');
const expect  = chai.expect;
const should  = chai.should;
const assert  = chai.assert;

describe("authentication/tokenizer.test.js", () => {

  it("should generate a token", () => {
    const tokenizer = ACQUIRE('#/authentication/tokenizer');
    const token = tokenizer(tokenizer.SCOPES.WEBUI, {lorem:'ipsum',userId:'adsf-3xsd-29x3-seer'});
    // console.log(token);

    // verified
    const jsonWebToken = ACQUIRE('jsonwebtoken');
    jsonWebToken.verify(token, FETCH_CONFIG('authentication.secret'), (err, decoded) => {
      console.log(err, decoded);
    });
  });

});
