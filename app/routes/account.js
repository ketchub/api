const _               = ACQUIRE('lodash');
const router          = ACQUIRE('express').Router();
const authentication  = ACQUIRE('#/authentication');
const bcrypt          = ACQUIRE('bcrypt');
const accountModel    = ACQUIRE('#/models/account');
const tokenizer       = ACQUIRE('#/authentication/tokenizer');
const writeSeedFile   = ACQUIRE('#/util/writeSeedFile');
const spawnJob        = ACQUIRE('#/lib/jobs');
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
        token: tokenizer(tokenizer.SCOPES.WEBUI, {accountId: userObj.id})
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

/**
 * Get a user's account details (based on the JWT passed via authorization
 * headers).
 * @type {[type]}
 */
router.get('/', authentication.check, ( req, res, next ) => {
  accountModel.loadById(req.requestToken.accountId, (err, userObj) => {
    if (err) { return next(err); }
    // userObj contains potentially sensitive info, so we only want to return
    // a specific subset of fields
    res.json({
      id: userObj.id,
      email: userObj.email,
      emailValidated: userObj.emailValidated,
      firstName: userObj.firstName,
      lastName: userObj.lastName,
      image: userObj.image,
      facebookId: userObj.facebookId,
      phone: userObj.phone,
      phoneValidated: userObj.phoneValidated
    });
  });
});

/**
 * Update the current user account.
 * @todo: per-field validation on all updates need to happen!
 * @type {Boolean}
 */
// router.put('/', authentication.check, ( req, res, next ) => {
//   const payload = req.body;
//
//   accountModel.updateById(
//     req.requestToken.accountId,
//     payload,
//     (err, resp) => {
//       res.json({err, resp});
//     }
//   );
// });

/**
 * Update account phone number.
 */
router.put('/phone', authentication.check, ( req, res, next ) => {
  const { phone } = req.body;
  const accountId = req.requestToken.accountId;
  const phoneValidationCode = makeVerificationCode(6);

  // first update the user record in the database
  accountModel.updateById(accountId,
    {phone, phoneValidationCode, phoneValidated:false},
    (err, resp) => {
      if (err) { return next(err); }
      // schedule the job
      // if (phone !== '4439565918') { return res.json({err: 'Must use 443 in testing!'}); }
      spawnJob(spawnJob.types.SEND_TEXT, {
        phone: phone,
        message: `Hi from Ketch! Your verification code is: ${phoneValidationCode}.`
      }, (err) => {
        res.json({err, message:'Verification sent.'});
      });
    }
  );
});

/**
 * Verify the phone validation code, and update record appropriately.
 * @todo: should check to see if the phone is already set to a validated state
 * before running the rest of the compare/check code in here.
 */
router.post('/phone/verify', authentication.check, (req, res, next) => {
  const { code } = req.body;

  accountModel.loadById(req.requestToken.accountId, (err, userObj) => {
    if (err) { return res.json({err}); }
    if (code !== userObj.phoneValidationCode) {
      return res.json({err: 'Code invalid'});
    }
    accountModel.updateById(
      req.requestToken.accountId,
      {phoneValidated:true, phoneValidationCode:null},
      (err, resp) => {
        if (err) { return res.json({err}); }
        res.json({err, resp});
      }
    );
  });
});

/**
 * Update the user's email address (forces a revalidation!).
 */
router.put('/email', authentication.check, (req, res, next) => {
  const { email } = req.body;
  const accountId = req.requestToken.accountId;
  const emailValidationCode = makeVerificationCode(10);
  const tokenizedString = tokenizer(tokenizer.SCOPES.API, {
    emailValidationCode, accountId
  });

  accountModel.updateById(accountId,
    {email, emailValidationCode, emailValidated:false},
    (err, resp) => {
      if (err) { return next(err); }
      if (email !== 'jhartman86@gmail.com') { return res.json({err:'During dev'}); }
      spawnJob(spawnJob.types.SEND_EMAIL, {
        toAddress: email,
        fromAddress: 'test@ketchr.com',
        subject: 'Ketch.com Email Validation',
        body: `
          <h4>Ketch Ride Notification</h4>
          <p>One more step! <a href="https://lo.cal:4433/account?verify_email=${tokenizedString}">Click here</a> to verify your email address with Ketch.</p>
        `
      }, (err, reply) => {
        res.json({err, reply});
      });
    }
  );
});

/**
 * Verify the email validation code (sent via a JWT token).
 */
router.post('/email/verify', authentication.check, (req, res, next) => {
  const { token } = req.body;
  const accountId = req.requestToken.accountId;
  const jsonWebToken = ACQUIRE('jsonwebtoken');

  jsonWebToken.verify(token, FETCH_CONFIG('authentication.secret'), (err, decoded) => {
    if (err) { return res.json({err}); }
    accountModel.loadById(accountId, (err, userObj) => {
      if (err) { return res.json({err}); }
      if (decoded.emailValidationCode !== userObj.emailValidationCode) {
        return res.json({err: 'Code invalid'});
      }
      accountModel.updateById(accountId,
        {emailValidated:true, emailValidationCode:null},
        (err, resp) => {
          if (err) { return res.json({err}); }
          res.json({err, resp});
        }
      );
    });
  });
});

/**
 * Generate a random verification code.
 * @return {string} 5 character slice of a random alphanum string.
 */
function makeVerificationCode( length ) {
  const crypto = ACQUIRE('crypto');
  return crypto.randomBytes(20).toString('hex').substr(0, length);
}

/**
 * Hash a plain text password to a format acceptable to store in the
 * database.
 * @param  {[type]}   plainTextPassword [description]
 * @param  {Function} done              [description]
 * @return {[type]}                     [description]
 */
function hashPassword(plainTextPassword, done) {
  bcrypt.genSalt(10, (err, salt) => {
    if (err) { return done(err); }
    bcrypt.hash(plainTextPassword, salt, (err, hashed) => {
      if (err) { return done(err); }
      done(null, hashed);
    });
  });
}
