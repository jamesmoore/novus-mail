/**
 * Extensions to the Express User interface
 * See https://github.com/panva/openid-client/blob/main/examples/passport.ts#L25
 */
declare namespace Express {
    interface User {
        sub: string
        email?: string
        picture?: string
    }
}