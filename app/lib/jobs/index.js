const Queue = ACQUIRE('rethinkdb-job-queue');
const q = new Queue({host: process.env.RETHINK_HOST, port: 28015, db: 'jobqueue'}, {
  name: 'snsTextMessage'
});

module.exports.snsTextMessage = function( details, done ) {
  const job = q.createJob();
  job._data = details;

  q.addJob(job).then((savedJobs) => {
    done(null, savedJobs);
  }).catch((err) => {
    done(err);
  });
}
