export interface User {
    strategy: string;
    email?: string;
    sub: string;
    isAuthenticated: boolean;
    picture?: string;
}