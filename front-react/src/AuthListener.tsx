import { useEffect } from "react";
import { useNavigate } from "react-router-dom";

function AuthListener() {
    const navigate = useNavigate();

    useEffect(() => {
        function handler() {
            console.log('auth lost handler');
            navigate('/');
        }

        window.addEventListener("auth-lost", handler);
        return () => {
            window.removeEventListener("auth-lost", handler);
        };
    }, [navigate]);

    return null;
}

export default AuthListener;