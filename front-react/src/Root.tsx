import useUser from "./useUser";
import Login from "./Login";
import MailboxRedirect from "./MailboxRedirect";

function Root() {
    const { data: user, isLoading: isUserLoading } = useUser();

    return (!user || !user.isAuthenticated && user.requiresAuth) ?
        <Login strategy={user?.strategy ?? "..."} loading={isUserLoading} /> :
        <MailboxRedirect />;
}

export default Root;