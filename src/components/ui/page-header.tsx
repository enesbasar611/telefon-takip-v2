import { LucideIcon } from "lucide-react";
import { ReactNode } from "react";

interface PageHeaderProps {
    title: string;
    description: string;
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
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 pb-2">
            <div className="flex items-center gap-5">
                <div className={`h-16 w-16 rounded-[2rem] ${iconBgColor} flex items-center justify-center border border-border/50 shadow-2xl transition-all hover:scale-105 duration-500`}>
                    <Icon className={`h-8 w-8 ${iconColor}`} />
                </div>
                <div>
                    {badge && <div className="mb-2">{badge}</div>}
                    <h1 className="font-medium text-4xl lg:text-5xl  text-white tracking-tight leading-tight">
                        {title}
                    </h1>
                    <p className="text-sm text-muted-foreground  mt-1 max-w-2xl leading-relaxed">
                        {description}
                    </p>
                </div>
            </div>
            {actions && <div className="flex items-center gap-3">{actions}</div>}
        </div>
    );
}




