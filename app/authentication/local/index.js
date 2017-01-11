const tokenizer = ACQUIRE('#/authentication/tokenizer');
const passport = ACQUIRE('passport');
const router = ACQUIRE('express').Router();
const bcrypt = ACQUIRE('bcrypt');
const accountModel = ACQUIRE('#/models/account');

module.exports = { router };

/**
 * Local authentication strategy (username/password); all this does
 * is authenticates the credentials and passes a user object to the
 * route authenticating with it (so router.post('/local')), which
 * then returns a JWT token for use for all other authentication.
 * @type {String}
 */
passport.use(new CustomLocalStrategy({
  session: false,
  verify( requestBody, done ) {
    const { email, password } = requestBody;
    accountModel.loadByEmail(email, (err, record) => {
      if (err) { return done(err); }
      if (!record) { return done(new Error('User not found.')); }
      bcrypt.compare(password, record.password, (bcryptErr, res) => {
        if (bcryptErr) { return done(bcryptErr); }
        if (!res) { return done(new Error('Password invalid.')); }
        done(null, record);
      });
    });
  }
}));

/**
 * The public route (mounted at /auth/local) which uses the 'local'
 * authentication strategy to return a JWT for subsequent use.
 */
router.post('/local', passport.authenticate('local', {session:false}),
  (req, res) => {
    console.log('here with', req.user);
    res.json({token:tokenizer(tokenizer.SCOPES.WEBUI, req.user)});
  }
);

/**
 * The passport-local module requires sending email and password as form
 * body data and other funky stuff, we just generate our own strategy here
 * since its pretty simple.
 * @param {object} options Strategy configuration
 */
function CustomLocalStrategy( options ) {
  passport.Strategy.call(this);
  this._options = options;
  this.name = 'local';
}

require('util').inherits(CustomLocalStrategy, passport.Strategy);

CustomLocalStrategy.prototype.authenticate = function(req, options = {}) {
  const self = this;

  try {
    self._options.verify(req.body, complete);
  } catch (ex) {
    return self.error(ex);
  }

  function complete(err, user, info) {
    if (err) { return self.error(err); }
    if (!user) { return self.fail(info); }
    self.success(user, info);
  }
};
