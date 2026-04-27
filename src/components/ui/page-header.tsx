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
        <div className="flex flex-col md:flex-row md:items-start justify-between gap-4 md:gap-8 mb-4 md:mb-6 px-4 md:px-0">
            <div className="flex items-start gap-4 md:gap-6">
                <div className={`h-12 w-12 md:h-20 md:w-20 rounded-2xl md:rounded-[2.5rem] ${iconBgColor} flex items-center justify-center border border-border/50 shadow-2xl transition-all hover:rotate-3 duration-500 shrink-0`}>
                    <Icon className={`h-6 w-6 md:h-10 md:w-10 ${iconColor}`} />
                </div>
                <div className="space-y-1 md:space-y-2">
                    {badge && <div className="flex flex-wrap gap-2">{badge}</div>}
                    <h1 className="font-semibold text-2xl md:text-4xl lg:text-6xl text-slate-900 dark:text-white tracking-tighter leading-none">
                        {title}
                    </h1>
                    <p className="text-xs md:text-base text-slate-500 dark:text-muted-foreground/80 max-w-2xl leading-relaxed font-medium">
                        {description}
                    </p>
                </div>
            </div>
            {actions && <div className="flex items-center gap-2 md:gap-3 self-end md:self-auto">{actions}</div>}
        </div>
    );
}




