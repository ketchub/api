const r                         = ACQUIRE('rethinkdb');
const getConnection             = ACQUIRE('#/lib/db/connection');
const TABLE_NAME                = 'accounts';
module.exports = {
  create: _create,
  loadById: _loadById,
  loadByEmail: _loadByEmail,
  loadByFacebookId: _loadByFacebookId,
  setPhoneValidationCode: _setPhoneValidationCode
};

/**
 * Create an account.
 * @todo: remember that email/phone will need to be REVALIDATED if they ever
 * change once validated first time.
 * @param  {Object}   data Account data info
 * @param  {Function} done Callback
 * @return {void}
 */
function _create(data, done) {
  const {
    email,
    password,
    firstName,
    lastName,
    phone,
    image,
    facebookId,
    facebookAccessToken
  } = data;

  const payload = {
    email: email ? email : null,
    emailValidated: false,
    password: password ? password : null,
    firstName: firstName ? firstName : null,
    lastName: lastName ? lastName : null,
    image: image ? image : null,
    facebookId: facebookId ? facebookId : null,
    facebookAccessToken: facebookAccessToken ? facebookAccessToken : null,
    phone: phone ? phone : null,
    phoneValidated: false
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
    r.table(TABLE_NAME).get(id)
    // r.table(TABLE_NAME).getAll(id, {index:'id'}).limit(1).coerceTo('array')
      .run(conn, (err, reply) => {
        conn.close();
        if (!reply) {
          // @todo: not-so-descriptive error message
          return done(new Error('Could not find account by id.'));
        }
        done(err, reply);
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
    r.table(TABLE_NAME).getAll(email, {index: 'email'}).limit(1).coerceTo('array')
    // r.table(TABLE_NAME).get(email)
      .run(conn, (err, reply) => {
        conn.close();
        if (!reply[0]) {
          // @todo: not-so-descriptive error message
          return done(new Error('Could not find account by email.'));
        }
        done(err, reply[0]);
      });
  });
}

/**
 * Retrieve account record by facebook id.
 * @param  {string}   id   Facebook identifier
 * @param  {function} done Callback
 * @return {void}
 */
function _loadByFacebookId(id, done) {
  getConnection((err, conn) => {
    if (err) { return done(err); }
    r.table(TABLE_NAME).getAll(id, {index:'facebookId'}).limit(1).coerceTo('array')
      .run(conn, (err, reply) => {
        conn.close();
        if (!reply[0]) {
          return done(new Error('Account does not exist.'));
        }
        done(err, reply[0]);
      });
  });
}

/**
 * Set phone validation code (this does *not* set that the phone # is verified,
 * simply sets the validation code being forwarded to AWS).
 * @param {[type]}   id                  [description]
 * @param {[type]}   phoneValidationCode [description]
 * @param {Function} done                [description]
 */
function _setPhoneValidationCode(id, phoneValidationCode, done) {
  getConnection((err, conn) => {
    if (err) { return done(err); }
    r.table(TABLE_NAME).get(id).update({phoneValidationCode})
      .run(conn, (err, reply) => {
        conn.close();
        done(err, reply);
      });
  });
}
