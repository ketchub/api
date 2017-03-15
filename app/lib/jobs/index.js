const Queue = ACQUIRE('rethinkdb-job-queue');
const rethinkdbdash = ACQUIRE('rethinkdbdash');
const connxn = rethinkdbdash({host: process.env.RETHINK_HOST, port: 28015, db: process.env.NODE_ENV});
// const connxn = {host: process.env.RETHINK_HOST, port: 28015, db: 'jobqueue'};
// const snsQueue = new Queue(connxn, {name: 'text', changeFeed:false});
// const emailQueue = new Queue(connxn, {name: 'email', changeFeed:false});
const globalQueue = new Queue(connxn, {name: 'jobs', changeFeed:false});

module.exports = spawn;
module.exports.types = {
  SYNC_FB_FRIENDS: 'SYNC_FB_FRIENDS',
  SEND_EMAIL: 'SEND_EMAIL',
  SEND_TEXT: 'SEND_TEXT'
};

/**
 * Given a user's accountId (the canonical id / uuid generated in our
 * database), and the user's facebookId; trigger a job that will update the
 * friend list (per facebook relationships) against the given user.
 * @param  {Object}   details Message details
 * @param  {Function} done    callback
 * @return {void}
 */
function spawn( type, _data, done ) {
  // @todo: done(new Error(...)) if type is not valid
  _data.TYPE = type;

  globalQueue.addJob(
    globalQueue.createJob(
      Object.assign({_data}, {
        priority: 'normal',
        timeout: 3500,
        retryMax: 2,
        retryDelay: 1000
      })
    )
  ).then((savedJobs) => {
    done(null, savedJobs);
  }).catch((err) => { done(err); });
}

/**
 * Send a text message job to the queue.
 * @param  {Object}   details Message details
 * @param  {function} done    Callback
 * @return {void}
 */
// function text( details, done ) {
//   const job = snsQueue.createJob(makeJobPayload(details, {
//     priority: 'normal',
//     timeout: 3500,
//     retryMax: 2,
//     retryDelay: 1000
//   }));
//   snsQueue.addJob(job).then((savedJobs) => {
//     done(null, savedJobs);
//   }).catch((err) => { done(err); });
// }

/**
 * Send an email job to the queue.
 * @param  {Object}   details Message details
 * @param  {Function} done    Callback
 * @return {void}
 */
// function email( details, done ) {
//   const job = emailQueue.createJob(makeJobPayload(details, {
//     priority: 'normal',
//     timeout: 3500,
//     retryMax: 2,
//     retryDelay: 1000
//   }));
//   emailQueue.addJob(job).then((savedJobs) => {
//     done(null, savedJobs);
//   }).catch((err) => { done(err); });
// }

/**
 * Create the payload to send to the job (eg, merge jobOptions defaults with
 * the job details in the _data property).
 * @param  {Object} details Job details/payload
 * @return {Object}
 */
// function makeJobPayload( details, jobOptions = {} ) {
//   return Object.assign({}, jobOptions, {_data:details});
// }
