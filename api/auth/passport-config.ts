/**
 * See https://github.com/panva/openid-client/blob/main/examples/passport.ts
 */
import { ClientSecretBasic, Configuration, discovery, fetchUserInfo } from 'openid-client'
import { Strategy, StrategyOptionsWithRequest, VerifyFunctionWithRequest } from './openid-client-passport.js';
import { Strategy as AnonymousStrategy } from 'passport-anonymous';
import { env } from '../env/env.js';
import { ensureLoggedIn } from 'connect-ensure-login';
import { Request, Response, NextFunction } from 'express';

const authConfig = {
  issuer: env.OIDC_ISSUER,
  clientID: env.OIDC_CLIENT_ID,
  clientSecret: env.OIDC_CLIENT_SECRET,
  redirectUri: env.REDIRECT_URI
};

const oidcEnabled =
  authConfig.clientID &&
  authConfig.clientSecret &&
  authConfig.issuer &&
  authConfig.redirectUri;

console.log(oidcEnabled ? 'OIDC enabled' : 'OIDC disabled');

export const configuration: Configuration = oidcEnabled ? await discovery(
  new URL(authConfig.issuer!), // visit authConfig.issuer + '/.well-known/openid-configuration'
  authConfig.clientID!,
  authConfig.clientSecret,
  ClientSecretBasic(authConfig.clientSecret!)
) : {} as Configuration;

//console.log(configuration.serverMetadata());

export const oidcStrategyOptions: StrategyOptionsWithRequest = {
  config: configuration,
  scope: 'openid email profile',
  callbackURL: authConfig.redirectUri!,
  name: 'oidc',
  passReqToCallback: true
}

const verify: VerifyFunctionWithRequest = (req, tokens, verified) => {

  const sub = tokens.claims()?.sub;
  if (sub) {
    fetchUserInfo(configuration, tokens.access_token, sub).then((userInfo) => {
      if (req.user) {
        req.user.email = userInfo.email;
      }
    }).catch(
      (e) => console.error('userinfo error', e)
    );
  }
  else {
    console.error('No sub in verify callback');
  }
  verified(null, tokens.claims());
}

export const passportConfig = oidcEnabled ? {
  strategy: new Strategy(oidcStrategyOptions, verify),
  middleware: (_req: Request, res: Response, next: NextFunction) => {
    if(_req.path.startsWith('/mail.svg') || _req.path.startsWith('/status')) return next();
    return ensureLoggedIn('/login')(_req, res, next);
  }
} : {
  strategy: new AnonymousStrategy(),
  middleware: (_req: Request, res: Response, next: NextFunction) => next()
};
