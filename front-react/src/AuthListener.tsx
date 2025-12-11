import { useQueryClient } from "@tanstack/react-query";
import { useEffect } from "react";
import { useNavigate } from "react-router-dom";

function AuthListener() {
    const navigate = useNavigate();
    const queryClient = useQueryClient();

    useEffect(() => {
        function handler() {
            console.log('auth lost handler');
            queryClient.invalidateQueries({ queryKey: ["user"] });
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