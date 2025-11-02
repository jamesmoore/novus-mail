/**
 * Special strategy to work with Authelia.
 * This is because Authelia requires a state in the authorization request. 
 * This line had to be made unconditional:
 *  redirectTo.searchParams.set('state', client.randomState())
 * See https://github.com/panva/openid-client/discussions/760
 * And https://github.com/authelia/authelia/issues/5566
 */
import { AuthenticateOptions, Strategy } from "openid-client/passport"
import * as client from 'openid-client';
import type * as express from 'express';

class CustomStrategy extends Strategy {
    authorizationRequestParams<TOptions extends AuthenticateOptions>(req: express.Request, options: TOptions) {
        const params = super.authorizationRequestParams(req, options);
        if (params) {
            if (params instanceof URLSearchParams) {
                params.set('state', client.randomState());
            } else {
                params.state = client.randomState();
            }
        }
        return params;
    }
}

export default CustomStrategy;