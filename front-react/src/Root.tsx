import useUser from "./useUser";
import Login from "./Login";
import MailboxRedirect from "./MailboxRedirect";

function Root() {
    const { data: user, isLoading, isRefetching } = useUser();

    const loadingInitial = !user || isLoading || isRefetching;

    if (loadingInitial) {
        return <Login loading={true} strategy="..." />;
    }

    const authenticated = user?.isAuthenticated;
    const requiresAuth = user?.requiresAuth;

    if (!authenticated && requiresAuth) {
        return <Login strategy={user.strategy} loading={false} />;
    }

    return <MailboxRedirect />;
}

export default Root;