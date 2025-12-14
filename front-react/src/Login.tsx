import { Box } from "@mui/material";
import { Button } from "./components/ui/button";
import { LogIn } from "lucide-react";

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
            <Button onClick={doLogin} disabled={loading}>
                <LogIn />
                Login with {strategy}
            </Button>
        </Box>
    );
}
