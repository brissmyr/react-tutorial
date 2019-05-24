function (user, context, callback) {
  // Get this from your Castle Dashboard, on the Settings page
  var apiSecret = configuration.CASTLE_API_SECRET;

  var options = {
    method: 'POST',
    auth: {
      'user': '',
      'pass': apiSecret
    },
    uri: 'https://api.castle.io/v1/authenticate',
    json: true,
    body: {
      event: '$login.succeeded',
      user_id: user.user_id,
      user_traits: {
        email: user.email,
        registered_at: user.created_at
      },
      context: {
        client_id: context.request.query.state,
        ip: context.request.ip,
        headers: {
          'User-Agent': context.request.userAgent
        }
      }
    }
  };

  request.post(options, function (err, httpResponse, body) {
    if (err) {
      console.error('Error in Castle Rule request', err);
      callback(new UnauthorizedError('Request library error, Castle was not called'));
    }

    if (!body.action) {
      callback(new UnauthorizedError('Castle did not return an action'), user, context);
    }

    if (body.action === 'allow') {
      callback(null, user, context);
    }

    if (body.action === 'challenge') {
      // initiate challenge
      callback(new UnauthorizedError('User did not complete challenge'), user, context);
    }

    if (body.action === 'deny') {
      callback(new UnauthorizedError('Castle denies access for this user and context'), user, context);
    }
  });
}