/**
 * Extensions to the Express User interface
 * See https://github.com/panva/openid-client/blob/main/examples/passport.ts#L25
 */
declare namespace Express {
    interface User {
        sub?: string
        name?: string
        email?: string
        picture?: string
        authType?: 'api-key'
        accessMode?: 'owner' | 'global'
        owner?: string
        apiKeyId?: string
    }

    interface Request {
        authPrincipal?: import('../../auth/auth-principal.js').AuthPrincipal
    }
}
