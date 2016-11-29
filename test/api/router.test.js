require('mocha');
const _       = require('lodash');
const chai    = require('chai');
const expect  = chai.expect;
const should  = chai.should;
const assert  = chai.assert;

describe("api/router.test.js", () => {

  it("should inspect variable type", () => {
    let a = 'alpha' || null;
    expect(a).to.be.a('string');
  });

});
