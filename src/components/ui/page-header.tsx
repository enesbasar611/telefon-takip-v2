import { LucideIcon } from "lucide-react";
import { ReactNode } from "react";

interface PageHeaderProps {
    title: string | ReactNode;
    description: string | ReactNode;
    icon: LucideIcon;
    iconColor?: string;
    iconBgColor?: string;
    breadcrumb?: {
        label: string;
        href?: string;
    }[];
    actions?: ReactNode;
    badge?: ReactNode;
    className?: string;
}

export function PageHeader({
    title,
    description,
    icon: Icon,
    iconColor = "text-blue-500",
    iconBgColor = "bg-blue-500/10",
    actions,
    badge,
    className,
}: PageHeaderProps) {
    return (
        <div className={`flex flex-col xl:flex-row xl:items-start justify-between gap-3 sm:gap-6 mb-3 sm:mb-6 px-1 sm:px-0 ${className || ""}`}>
            <div className="flex items-center md:items-start gap-3 sm:gap-4 flex-1 min-w-0 group">
                <div className={`h-9 w-9 sm:h-12 sm:w-12 rounded-xl sm:rounded-2xl ${iconBgColor} flex items-center justify-center border border-border/50 shadow-sm shrink-0 transition-transform group-hover:scale-110 duration-500`}>
                    <Icon className={`h-4.5 w-4.5 sm:h-6 sm:w-6 ${iconColor}`} />
                </div>
                <div className="space-y-0.5 sm:space-y-1.5 min-w-0">
                    <div className="flex items-center gap-2 sm:gap-3 flex-wrap">
                        <h1 className="font-extrabold text-lg sm:text-2xl text-slate-900 dark:text-white tracking-tight leading-tight truncate group-hover:text-primary transition-colors duration-500">
                            {title}
                        </h1>
                        {badge && <div className="shrink-0 scale-95 sm:scale-100 origin-left">{badge}</div>}
                    </div>
                    {description && (
                        <div className="hidden sm:block text-xs sm:text-sm text-slate-500 dark:text-slate-400 max-w-2xl font-bold tracking-tight leading-relaxed">
                            {description}
                        </div>
                    )}
                </div>
            </div>
            {actions && <div className="flex items-center gap-2 self-start xl:self-auto shrink-0 max-w-full overflow-x-auto sm:overflow-visible no-scrollbar py-1">{actions}</div>}
        </div>
    );
}




