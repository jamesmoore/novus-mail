export interface User {
    strategy: string;
    name?: string;
    email?: string;
    sub: string;
    isAuthenticated: boolean;
    picture?: string;
    requiresAuth: boolean;
}