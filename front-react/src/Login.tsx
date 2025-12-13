import { Box, Button } from "@mui/material";
import LoginIcon from '@mui/icons-material/Login';

interface LoginProps {
    strategy: string,
    loading: boolean,
}

export default function Login({ strategy, loading }: LoginProps) {
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
            <Button onClick={doLogin} variant="contained" loading={loading} startIcon={<LoginIcon />}>
                Login with {strategy}
            </Button>
        </Box>
    );
}
