import { Box, Button } from "@mui/material";
import { use, useEffect, useState } from "react";
import { User } from "./models/user";
import { fetchUser } from "./api-client";
import { useNavigate } from "react-router-dom";

function Login() {
    const navigate = useNavigate();
    const [user, setUser] = useState<User>();
    useEffect(() => {
        fetchUser().then((p) => setUser(p));
    }, []);

    useEffect(() => {

        if (!user) {
            return;
        }

        if (user?.isAuthenticated || !user?.requiresAuth) {
            navigate('/')
        }

    }, [user]);

    return <>

        <Box alignContent={"center"} alignItems={"center"} >
            <Button fullWidth={false} onClick={doLogin} >Login {user ? <>with {user.strategy} </> : <></>} </Button>
        </Box>
    </>
}

function doLogin() {

    window.location.href = '/login';

}

export default Login;