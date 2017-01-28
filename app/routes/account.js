const _               = ACQUIRE('lodash');
const router          = ACQUIRE('express').Router();
const authentication  = ACQUIRE('#/authentication');
const bcrypt          = ACQUIRE('bcrypt');
const accountModel    = ACQUIRE('#/models/account');
const tokenizer       = ACQUIRE('#/authentication/tokenizer');
const writeSeedFile   = ACQUIRE('#/util/writeSeedFile');
router.MOUNT_POINT    = '/account';

module.exports = router;

/**
 * Create a new user account.
 * @type {[type]}
 */
router.post('/', (req, res, next) => {
  const payload = req.body;

  hashPassword(payload.password, (err, hashedPassword) => {
    if (err) { return next(err); }
    payload.password = hashedPassword;
    accountModel.create(payload, (err3, userObj) => {
      if (err3) { return next(err3); }
      res.json({
        token: tokenizer(tokenizer.SCOPES.WEBUI, userObj)
      });
      // @todo: make this configurable
      writeSeedFile('account', userObj, (err) => {
        if (err) {
          return console.log('\n\n-- FAILED WRITING ACCOUNT SEED --\n\n', err);
        }
        console.log('Account seed generated OK.');
      });
    });
  });
});

router.get('/', authentication.check, ( req, res, next ) => {
  accountModel.loadById(req.requestToken.accountId, (err, userObj) => {
    if (err) { return next(err); }
    // userObj contains potentially sensitive info, so we only want to return
    // a specific subset of fields
    res.json({
      id: userObj.id,
      email: userObj.email,
      firstName: userObj.firstName,
      lastName: userObj.lastName,
      image: userObj.image,
      facebookId: userObj.facebookId,
      phone: userObj.phone
    });
  });
});

function hashPassword(plainTextPassword, done) {
  bcrypt.genSalt(10, (err, salt) => {
    if (err) { return done(err); }
    bcrypt.hash(plainTextPassword, salt, (err, hashed) => {
      if (err) { return done(err); }
      done(null, hashed);
    });
  });
}

router.get('/verify-phone-request', authentication.check, (req, res, next) => {
  accountModel.loadById(req.requestToken.accountId, (err, userObj) => {
    if (err) { return res.json({err}); }
    const jobs = ACQUIRE('#/lib/jobs');
    const crypto = ACQUIRE('crypto');
    const code = crypto.randomBytes(20).toString('hex').substr(0, 7);

    // @todo: update user record in database with this code...
    accountModel.setPhoneValidationCode(userObj.id, code, (err, vReply) => {
      jobs.snsTextMessage({
        type: 'VERIFY_PHONE_REQUEST',
        phone: userObj.phone,
        message: `Hi from Ketch! Your verification code is: ${code}`
      }, (err) => {
        res.json({err, vReply});
      });
    });
  });
});
