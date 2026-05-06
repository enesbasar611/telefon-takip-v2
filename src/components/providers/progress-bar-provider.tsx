"use client";

import { AppProgressBar as ProgressBar } from 'next-nprogress-bar';

export function ProgressBarProvider({ children }: { children: React.ReactNode }) {
    return (
        <>
            {children}
            <ProgressBar
                height="3px"
                color="var(--brand-color, #6366f1)"
                options={{ showSpinner: false, trickleSpeed: 200 }}
                shallowRouting
                style="position:fixed;top:0;left:0;right:0;z-index:9999;"
            />
        </>
    );
}




