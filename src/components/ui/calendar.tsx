"use client";

import * as React from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { DayPicker } from "react-day-picker";

import { cn } from "@/lib/utils";
import { buttonVariants } from "@/components/ui/button";

export type CalendarProps = React.ComponentProps<typeof DayPicker>;

function Calendar({
    className,
    classNames,
    showOutsideDays = true,
    ...props
}: CalendarProps) {
    return (
        <DayPicker
            showOutsideDays={showOutsideDays}
            className={cn("p-3", className)}
            classNames={{
                months: "flex flex-col sm:flex-row space-y-4 sm:space-x-4 sm:space-y-0",
                month: "space-y-4",
                caption: "flex justify-center pt-1 relative items-center",
                caption_label: "text-sm font-medium",
                nav: "space-x-1 flex items-center",
                nav_button: cn(
                    buttonVariants({ variant: "outline" }),
                    "h-7 w-7 bg-transparent p-0 opacity-50 hover:opacity-100"
                ),
                nav_button_previous: "absolute left-1",
                nav_button_next: "absolute right-1",
                table: "w-full border-collapse space-y-1",
                head_row: "flex",
                head_cell: "text-muted-foreground rounded-md w-9 font-normal text-[0.8rem] text-center",
                row: "flex w-full mt-2",
                cell: cn(
                    "relative p-0 text-center text-sm focus-within:relative focus-within:z-20",
                    "[&:has([aria-selected])]:bg-emerald-500/10",
                    "[&:has([aria-selected].day-range-start)]:rounded-l-[50%]",
                    "[&:has([aria-selected].day-range-end)]:rounded-r-[50%]",
                    "[&:has([aria-selected].day-outside)]:bg-transparent",
                    "[&:has([aria-selected].day-outside)]:opacity-50",
                    "w-9 h-9"
                ),
                day: cn(
                    buttonVariants({ variant: "ghost" }),
                    "h-9 w-9 p-0 font-normal aria-selected:opacity-100 rounded-full transition-all"
                ),
                range_start: "day-range-start !bg-emerald-600 !text-white !rounded-full shadow-lg shadow-emerald-500/20",
                range_end: "day-range-end !bg-emerald-600 !text-white !rounded-full shadow-lg shadow-emerald-500/20",
                selected:
                    "!bg-emerald-600 !text-white hover:!bg-emerald-700 hover:!text-white focus:!bg-emerald-600 focus:!text-white",
                today: "text-emerald-600 font-extrabold bg-emerald-50/50 dark:bg-emerald-950/50",
                outside:
                    "day-outside text-muted-foreground opacity-30 aria-selected:bg-transparent aria-selected:text-muted-foreground aria-selected:opacity-30",
                disabled: "text-muted-foreground opacity-50",
                range_middle:
                    "aria-selected:bg-transparent aria-selected:text-emerald-900 dark:aria-selected:text-emerald-100 !rounded-none",
                hidden: "invisible",
                ...classNames,
            }}
            components={{
                Chevron: ({ ...props }) => {
                    if (props.orientation === "left") {
                        return <ChevronLeft className="h-4 w-4" />;
                    }
                    return <ChevronRight className="h-4 w-4" />;
                },
            }}
            {...props}
        />
    );
}
Calendar.displayName = "Calendar";

export { Calendar };
