"use client";

import { AppProgressBar as ProgressBar } from 'next-nprogress-bar';

export function ProgressBarProvider({ children }: { children: React.ReactNode }) {
    return (
        <>
            {children}
            <ProgressBar
                height="5px"
                color="#4285F4"
                options={{ showSpinner: false }}
                shallowRouting
            />
        </>
    );
}



