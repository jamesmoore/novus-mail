import { LoaderCircle } from "lucide-react";

function LoadingSpinner() {
    return <div className="flex flex-1 justify-center items-center">
        <div className="delayed-fade-in">
            <LoaderCircle className="animate-spin"/>
        </div>
    </div>;
}

export default LoadingSpinner;