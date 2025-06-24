import {useEffect} from "react";

declare global {
    interface Window {
        frameworkReady?: () => void;
    }
}

const useFrameworkReady = () => {
    useEffect(() => {
        window.frameworkReady?.();
    });
}
export default useFrameworkReady
