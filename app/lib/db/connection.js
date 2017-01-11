const r = require('rethinkdb');

/**
 * @todo: this can pile up a shitton of back pressure on calls to
 * the error handler that will never be invoked but be kept in memory.
 * @param  {function} ready Callback
 * @return {void}
 */
module.exports = function getConnection(ready) {
  r.connect({
    db:   process.env.NODE_ENV,
    host: process.env.RETHINK_HOST,
    port: 28015
  }, (err, conn) => {
    if (err) { return ready(err); }
    ready(null, conn);
  });
}
