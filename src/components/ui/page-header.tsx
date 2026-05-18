import { LucideIcon } from "lucide-react";
import { ReactNode } from "react";

interface PageHeaderProps {
    title: string;
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
}

export function PageHeader({
    title,
    description,
    icon: Icon,
    iconColor = "text-blue-500",
    iconBgColor = "bg-blue-500/10",
    actions,
    badge,
}: PageHeaderProps) {
    return (
        <div className="flex flex-col xl:flex-row xl:items-start justify-between gap-6 mb-4 md:mb-6 px-4 md:px-0">
            <div className="flex items-start gap-4 flex-1 min-w-0">
                <div className={`h-10 w-10 md:h-12 md:w-12 rounded-xl md:rounded-2xl ${iconBgColor} flex items-center justify-center border border-border/50 shadow-sm shrink-0`}>
                    <Icon className={`h-5 w-5 md:h-6 md:w-6 ${iconColor}`} />
                </div>
                <div className="space-y-1 md:space-y-1.5 min-w-0">
                    <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-3">
                        <h1 className="font-bold text-xl md:text-2xl text-slate-900 dark:text-white tracking-tight leading-none truncate">
                            {title}
                        </h1>
                        {badge && <div className="shrink-0">{badge}</div>}
                    </div>
                    {description && (
                        <div className="text-xs md:text-sm text-slate-500 dark:text-muted-foreground/80 max-w-2xl font-medium break-words">
                            {description}
                        </div>
                    )}
                </div>
            </div>
            {actions && <div className="flex items-center gap-2 self-start xl:self-auto shrink-0 w-full xl:w-auto overflow-x-auto pb-2 xl:pb-0">{actions}</div>}
        </div>
    );
}




