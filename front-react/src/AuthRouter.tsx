import useUser from "./useUser";
import Login from "./Login";
import { ReactNode, useEffect } from "react";
import LoadingSpinner from "./LoadingSpinner";

export interface RootProps {
    children: ReactNode;
}

export default function AuthRouter({ children }: RootProps) {
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
        return <div className='flex h-dvh items-center'>
            <LoadingSpinner />
        </div>;
    }

    if (user && !user.isAuthenticated && user.requiresAuth) {
        return <div className="flex h-dvh justify-center items-center">
            <Login strategy={user.strategy} loading={false} />
        </div>;
    }

    return <div className="h-dvh">{children}</div>;
}