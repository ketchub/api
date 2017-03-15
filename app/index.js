require('./_bootstrap');
const _           = ACQUIRE('lodash');
const express     = ACQUIRE('express');
const app         = express();
const bodyParser  = ACQUIRE('body-parser');
const authentication = ACQUIRE('#/authentication');
const authenticationLocal = ACQUIRE('#/authentication/local');
const authenticationFacebook = ACQUIRE('#/authentication/facebook');

console.log(
  `\n\n RUNNING WITH NODE_ENV: ${process.env.NODE_ENV} ${process.env.RETHINK_HOST} \n\n`
);

// Bind middlewares
app.use(bodyParser.json());
app.use(bodyParser.raw());
app.use(bodyParser.urlencoded({extended:true}));

// Setup authentication
app.use(authentication.passport.initialize());
app.use('/auth', [
  authenticationLocal.router,
  authenticationFacebook.router
]);

// Bind all the routers
_.each(ACQUIRE('#/routes'), (router) => {
  app.use(router.MOUNT_POINT, router);
});

// Error handler (*must* be after other .use() calls)
app.use((err, req, res, next) => {
  console.log('error handler invoked?');
  if (res.headersSent) {
    console.log('what was already sent?');
    return next(err);
  }
  if (err) {
    return res.status(501).json({error:err.message});
  }
});

// Boot 'er up
app.listen(3000, '0.0.0.0', () => {
  process.stdout.write(`Serving on 0.0.0.0:3000`);
});
