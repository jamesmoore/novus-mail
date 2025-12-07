import useUser from "./useUser";
import Login from "./Login";
import MailboxRedirect from "./MailboxRedirect";

function Root() {
    const { data: user, isLoading: isUserLoading } = useUser();

    const notLoggedIn = !user || !user.isAuthenticated && user.requiresAuth;

    console.log("Root/Needs login: ", notLoggedIn);

    return notLoggedIn ?
        <Login strategy={user?.strategy ?? "..."} loading={isUserLoading} /> :
        <MailboxRedirect />;
}

export default Root;