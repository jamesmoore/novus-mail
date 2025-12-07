import { Navigate, Route, BrowserRouter as Router, Routes } from "react-router-dom";
import AuthListener from "./AuthListener";
import Layout from "./Layout";
import Manage from "./Manage";
import DeletedMailbox from "./DeletedMailbox";
import Mail from "./Mail";
import Mailbox from "./Mailbox";
import TopBarSettings from "./TopBarSettings";
import TopBarDeleted from "./TopBarDeleted";
import TopBarAddress from "./TopBarAddress";
import useUser from "./useUser";
import Login from "./Login";
import MailboxRedirect from "./MailboxRedirect";

function AppRouter() {
    const { data: user, isLoading: isUserLoading } = useUser();

    const needsLogin = !user || !user.isAuthenticated && user.requiresAuth;

    return (
        needsLogin ?
            <Login strategy={user?.strategy ?? "..."} loading={isUserLoading} /> :
            <Router>
                <AuthListener />
                <Routes>
                    <Route path="/" element={<MailboxRedirect />} />
                    <Route path="/manage" element={<Layout bodyChildren={<Manage />} topBarChildren={<TopBarSettings />} />} />
                    <Route path="/deleted" element={<Layout bodyChildren={<DeletedMailbox />} topBarChildren={<TopBarDeleted />} />} />
                    <Route path="/mail/:address/:messageId" element={<Layout bodyChildren={<Mail />} topBarChildren={<TopBarAddress />} />} />
                    <Route path="/inbox/:address" element={<Layout bodyChildren={<Mailbox />} topBarChildren={<TopBarAddress />} />} />
                    <Route path="*" element={<Navigate to="/" />} />
                </Routes>
            </Router>
    );
}

export default AppRouter;