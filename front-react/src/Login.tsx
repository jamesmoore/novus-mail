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
        <div className="flex justify-center items-center h-dvh">
            <Button onClick={doLogin} disabled={loading}>
                <LogIn />
                Login with {strategy}
            </Button>
        </div>
    );
}
