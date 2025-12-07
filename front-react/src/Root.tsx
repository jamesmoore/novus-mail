import useUser from "./useUser";
import Login from "./Login";
import MailboxRedirect from "./MailboxRedirect";

function Root() {
    const { data: user, isLoading, isRefetching } = useUser();

    const notLoggedIn = !user || isLoading || isRefetching || !user.isAuthenticated && user.requiresAuth;

    console.log("Root/Needs login: ", notLoggedIn, " isRefecting: " + isRefetching);

    return notLoggedIn ?
        <Login strategy={user?.strategy ?? "..."} loading={isLoading || isRefetching} /> :
        <MailboxRedirect />;
}

export default Root;