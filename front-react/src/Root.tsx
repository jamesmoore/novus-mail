import useUser from "./useUser";
import Login from "./Login";
import { ReactNode, useEffect } from "react";

export interface RootProps {
    children: ReactNode;
}

function Root({ children }: RootProps) {
    const { data: user, isLoading, refetch} = useUser();

    useEffect(() => {
        function handler() {
            console.log('auth lost handler');
            refetch();
        }

        window.addEventListener("auth-lost", handler);
        return () => {
            window.removeEventListener("auth-lost", handler);
        };
    }, [refetch]);

    const loadingInitial = !user || isLoading;

    if (loadingInitial) {
        return <Login loading={true} strategy="..." />;
    }

    const authenticated = user?.isAuthenticated;
    const requiresAuth = user?.requiresAuth;

    if (!authenticated && requiresAuth) {
        return <Login strategy={user.strategy} loading={false} />;
    }

    return children;
}

export default Root;