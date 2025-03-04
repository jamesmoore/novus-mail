import { Fade } from "@mui/material";
import { ReactElement } from "react";

export interface FadeDelayProps {
    children: ReactElement;
    isLoading: boolean;
}

function FadeDelay({ children, isLoading }: FadeDelayProps) {
    return (
        <Fade
            in={isLoading}
            style={{
                transitionDelay: isLoading ? '800ms' : '0ms',
            }}
            unmountOnExit
        >
            {children}
        </Fade>
    )
}


export default FadeDelay;