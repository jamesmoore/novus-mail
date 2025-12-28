/**
 * See https://github.com/panva/openid-client/blob/main/examples/passport.ts
 */
import { ClientSecretBasic, Configuration, discovery, fetchUserInfo } from 'openid-client'
import { StrategyOptionsWithRequest, VerifyFunctionWithRequest } from 'openid-client/passport';
import { Strategy as AnonymousStrategy } from 'passport-anonymous';
import { env } from '../env/env.js';
import { Request, Response, NextFunction } from 'express';
import CustomStrategy from './custom-strategy.js';

const authConfig = {
  issuer: env.OIDC_ISSUER,
  clientID: env.OIDC_CLIENT_ID,
  clientSecret: env.OIDC_CLIENT_SECRET,
  redirectUri: env.REDIRECT_URI
};

export const authMode =
  authConfig.clientID &&
  authConfig.clientSecret &&
  authConfig.issuer &&
  authConfig.redirectUri ? 'oidc' : 'anonymous';

console.log(`Auth mode: ${authMode}`);

export const configuration: Configuration = (authMode === 'oidc') ? await discovery(
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

const verify: VerifyFunctionWithRequest = async (req, tokens, verified) => {
  const claims = tokens.claims();
  if (!claims?.sub) {
    return verified(new Error("No sub"));
  }

  try {
    const userInfo = await fetchUserInfo(configuration, tokens.access_token, claims.sub);

    verified(null, {
      ...claims,
      name: userInfo.name,
      email: userInfo.email,
      picture: userInfo.picture,
    });
  } catch (e) {
    verified(e);
  }
};

export const passportConfig = authMode === 'oidc' ? {
  strategy: new CustomStrategy(oidcStrategyOptions, verify),
  middleware: (_req: Request, res: Response, next: NextFunction) => {
    if (
      _req.isAuthenticated() ||
      _req.path.startsWith('/api/status') ||
      _req.path.startsWith('/status')
    ) 
    return next();
    res.status(401).send();
  }
} : {
  strategy: new AnonymousStrategy(),
  middleware: (_req: Request, res: Response, next: NextFunction) => next()
};
