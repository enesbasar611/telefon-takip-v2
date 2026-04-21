"use client";

export function DashboardContent({ children }: { children: React.ReactNode }) {
    return (
        <div className="flex-1 flex flex-col overflow-hidden h-full relative">
            {children}
        </div>
    );
}



