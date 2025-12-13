import useUser from "./useUser";
import Login from "./Login";
import { ReactNode, useEffect } from "react";

export interface RootProps {
    children: ReactNode;
}

function Root({ children }: RootProps) {
    const { data: user, isLoading, refetch } = useUser();

    useEffect(() => {
        const handler = () => {
            refetch();
        };

        window.addEventListener("auth-lost", handler);
        return () => window.removeEventListener("auth-lost", handler);
    }, [refetch]);

    // Only block on first-ever load
    if (isLoading && !user) {
        return <Login loading={true} strategy="..." />;
    }

    if (user && !user.isAuthenticated && user.requiresAuth) {
        return <Login strategy={user.strategy} loading={false} />;
    }

    return <>{children}</>;
}

export default Root;