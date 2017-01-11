const r                     = ACQUIRE('rethinkdb');
const getConnection         = ACQUIRE('#/lib/db/connection');
const TABLE_NAME            = 'accounts';
module.exports.create       = _create;
module.exports.loadById     = _loadById;
module.exports.loadByEmail  = _loadByEmail;

/**
 * Create an account.
 * @param  {Object}   data Account data info
 * @param  {Function} done Callback
 * @return {void}
 */
function _create(data, done) {
  const { email, password, firstName, lastName, image } = data;

  getConnection((err, conn) => {
    if (err) { return done(err); }
    r.table(TABLE_NAME).insert({
      id: r.uuid(),
      email,
      password,
      firstName,
      lastName,
      image
    }, {returnChanges:true, conflict:"error"})
      .run(conn, (err, reply) => {
        if (err) { return done(err); }
        if (reply && reply.errors) {
          return done(new Error(reply.first_error));
        }
        if (reply && reply.changes && !reply.changes.length) {
          return done(new Error('Error occurred, account not created.'));
        }
        done(null, reply.changes[0].new_val);
      });
  });
}

/**
 * Retrieve account record by ID.
 * @param  {string}   id   UUID
 * @param  {Function} done Callback
 * @return {void}
 */
function _loadById(id, done) {
  getConnection((err, conn) => {
    if (err) { return done(err); }
    r.table(TABLE_NAME).getAll(id, {index:'id'}).nth(0)
      .run(conn, (err, reply) => {
        done(err, reply);
        conn.close();
      });
  });
}

/**
 * Retrieve account record by email.
 * @param  {string}   email Email address
 * @param  {Function} done  Callback
 * @return {void}
 */
function _loadByEmail(email, done) {
  getConnection((err, conn) => {
    if (err) { return done(err); }
    r.table(TABLE_NAME).get(email)
      .run(conn, (err, reply) => {
        done(err, reply);
        conn.close();
      });
  });
}
