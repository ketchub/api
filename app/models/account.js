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
  const payload = {
    id: r.uuid(),
    email, password, firstName, lastName, image
  };

  if (data.id) { payload.id = data.id; }

  getConnection((err, conn) => {
    if (err) { return done(err); }
    r.table(TABLE_NAME).insert(payload, {returnChanges:true, conflict:"error"})
      .run(conn, (err, reply) => {
        conn.close();
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
    r.table(TABLE_NAME).getAll(id, {index:'id'}).limit(1).coerceTo('array')
      .run(conn, (err, reply) => {
        conn.close();
        console.log('\n LOADING ACCOUNT BY ID: \n', err, reply);
        if (!reply[0]) {
          return done(new Error('Account does not exist.'));
        }
        done(err, reply[0]);
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
        conn.close();
        done(err, reply);
      });
  });
}
