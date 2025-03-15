/**
 * See https://github.com/panva/openid-client/blob/main/examples/passport.ts
 */
import { Configuration, discovery } from 'openid-client'
import { StrategyOptions } from './openid-client-passport.js';

const authConfig = {
  issuer: process.env.OIDC_ISSUER!,
  clientID: process.env.OIDC_CLIENT_ID!,
  clientSecret: process.env.OIDC_CLIENT_SECRET!,
  redirectUri: process.env.REDIRECT_URI!
};

export const configuration: Configuration = await discovery(
  // new URL(authConfig.issuer + '/.well-known/openid-configuration'),
  new URL(authConfig.issuer),
  authConfig.clientID,
  authConfig.clientSecret
);

console.log(configuration.serverMetadata())

const scope = 'openid email'

const oidcOptionsName = 'oidc';

export const oidcStrategyOptions: StrategyOptions = {
  config: configuration,
  scope,
  callbackURL: `${process.env.REDIRECT_URI}`,
  name: oidcOptionsName,
}
