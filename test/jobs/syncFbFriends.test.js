require('mocha');
const _       = require('lodash');
const chai    = require('chai');
const expect  = chai.expect;
const should  = chai.should;
const assert  = chai.assert;

describe('jobs/syncFbFriends.test.js', () => {
  it('should send to job queue', (done) => {
    const spawnJob = ACQUIRE('#/lib/jobs');
    spawnJob(spawnJob.types.SYNC_FB_FRIENDS, {
      lorem: 'vegas2'
    }, done);
  });
});
