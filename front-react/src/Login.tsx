import { Box, Button, CircularProgress } from "@mui/material";
import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import useUser from "./useUser";
import LoginIcon from '@mui/icons-material/Login';

export default function Login() {
    const navigate = useNavigate();
    const { data: user, isLoading } = useUser();

    useEffect(() => {
        if (isLoading || !user) return;

        if (user.isAuthenticated || !user.requiresAuth) {
            navigate("/");
        }
    }, [isLoading, user, navigate]);

    const doLogin = () => {
        window.location.href = "/login";
    };

    return (
        <Box
            display="flex"
            justifyContent="center"
            alignItems="center"
            height="100vh"
        >
            {isLoading ? (
                <CircularProgress />
            ) : (
                <Button onClick={doLogin} variant="contained" loading={isLoading} endIcon={<LoginIcon />}>
                    Login {user && <>with {user.strategy}</>}
                </Button>
            )}
        </Box>
    );
}
