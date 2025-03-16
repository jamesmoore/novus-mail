/**
 * See https://github.com/panva/openid-client/blob/main/examples/passport.ts
 */
import { Configuration, discovery } from 'openid-client'
import { Strategy, StrategyOptions, VerifyFunction } from './openid-client-passport.js';
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
  authConfig.clientSecret
) : {} as Configuration;

//console.log(configuration.serverMetadata());

const scope = 'openid email'

const oidcOptionsName = 'oidc';

export const oidcStrategyOptions: StrategyOptions = {
  config: configuration,
  scope,
  callbackURL: `${env.REDIRECT_URI}`,
  name: oidcOptionsName,
}

const verify: VerifyFunction = (tokens, verified) => {
  verified(null, tokens.claims())
}

export const passportConfig = oidcEnabled ? {
  strategy: new Strategy(oidcStrategyOptions, verify),
  middleware: ensureLoggedIn('/login')
}: {
  strategy: new AnonymousStrategy(),
  middleware: (_req: Request, res: Response, next: NextFunction) => next()
};
