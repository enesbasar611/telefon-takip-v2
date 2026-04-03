"use client";

import { AppProgressBar as ProgressBar } from 'next-nprogress-bar';

export function ProgressBarProvider({ children }: { children: React.ReactNode }) {
    return (
        <>
            {children}
            <ProgressBar
                height="3px"
                color="#4285F4"
                options={{ showSpinner: false }}
                shallowRouting
            />
            <style jsx global>{`
                #nprogress .bar {
                    background: linear-gradient(to right, #4285F4, #EA4335, #FBBC05, #34A853) !important;
                }
            `}</style>
        </>
    );
}
