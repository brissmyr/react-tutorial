# Castle Integration with Auth0 [React App example]

This repository includes slight changes to the [Auth0 Blog React Tutorial](https://github.com/auth0-blog/react-tutorial).

The Auth0 configuration parameters are expected to be defined in two `.env` files, specified as:

```
// in backend/.env

ISSUER=https://{Your Auth0 Domain}
AUDIENCE={Your Auth0 App ID}
JWKS_URI=https://{Your Auth0 base URL}.well-known/jwks.json

// in frontend/.env

REACT_APP_AUTH0_DOMAIN={Your Auth0 Domain}
REACT_APP_AUTH0_CLIENT_ID={Your Auth0 app Client ID}
```

At a minimum, the following configurations need to be updated in your Auth0 app settings:

1. Register the localhost callback url: `http://localhost:3000/callback`
2. Register the allowed logout url: `http://localhost:3000`
3. Create a Rule to add Castle to the authentication process (see section below)

## The Castle `/authenticate` Integration with Auth0

Auth0 allows [Rules](https://auth0.com/docs/rules) that can be executed when a user authenticates to your application. We will create and use such a rule to integrate Castle with Auth0 for your application. This rule will run a JavaScript function which digests the user information and the context of the authentication, calls the `/authenticate` endpoint at Castle.io, and proceeds with authentication based on the Castle verdict. 

Documentation about Castle's `/authenticate` endpoint [can be found here](https://castle.io/docs/api_reference).

The code for the rule is below:

```
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
```

The response body from the Castle `/authenticate` endpoint will contain a recommended `action` of `allow`, `challenge`, or `deny`. The payload looks like this:

```
{ 
  action: 'allow',
  user_id: 'auth0|5ce6ef7c6202f3110407efe1',
  device_token: 'eyJhbGciOiJIUzI1NiJ9.eyJ0b2tlbiI6IkU5QThIRG9LSkRXcE14bXJDeFFKYVRpb1dwWEw4bU1FIiwidmVyc2lvbiI6MC4xfQ.PNrnAHbrD5En3nFc-XFmRmT1IhdzZ3V-gh12fDdHu6g'
}
```

## Castle Webhooks Integration with Auth0

### Tracking `challenge` Recommendations with Castle

Several other integrations with Castle's product offerings are possible with Auth0 Rules. One such integration is possible as a logical next step to handle the Castle `challenge` verdict after the Castle `/authenticate` endpoint has been integrated. If the context for a user login results in a risk score above the tolerable risk threshold, Castle will return a `challenge` recommendation. The method of challenging the user, whether using SMS, a questionnaire, email, a hardware token, etc. is left to you.

Castle provides webhooks to assist in account management for various scenarios of success or failure by the end user in a `challenge` scenario. An example scenario starts with Castle returning a `challenge` verdict requested. You would send the event `$challenge.requested` to the Castle `/track` endpoint. When a user completes the challenge successfully, a `$challenge.succeeded` event would be tracked. Alternatively, a `$challenge.failed` could be used to initiate a `$review.opened` event. These track events to Castle will move the risk score for that particular user and context, which will help to secure the user's account as well as reduce future friction for authenticating that user.

### Device Reporting and Account Recovery with Castle

Castle offers many other webhooks that help to automate the account recovery process. The webhooks are designed with user flows in mind that allow users to perform much of the work associated with account recovery. Examples of these webhooks include the `$review.escalated` and `$incident.confirmed` event types, managing password resets with `$password_reset.succeeded`, and more.

---

# React Tutorial: Building and Securing Your First App

Application repo accompanying this Auth0 article. In this article, you will learn how to build modern applications with React and Node.js.

[React Tutorial: Building and Securing Your First App](https://auth0.com/blog/react-tutorial-building-and-securing-your-first-app/)

## Running This Sample

To facilitate running this sample, I've left my own Auth0 configuration values in this repo. As such, you can simply run the following commands to run this sample:

```bash
# after cloning, move into this dir
cd react-tutorial

# install backend deps
cd backend
npm i

# run backend on the background
node src &

# install frontend deps
cd ../frontend
npm i

# run the frontend app
npm start
```