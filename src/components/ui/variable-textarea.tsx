"use client";

import * as React from "react";
import { cn } from "@/lib/utils";
import { Textarea } from "@/components/ui/textarea";

interface VariableTextareaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
    variables: string[];
    onValueChange?: (value: string) => void;
}

export function VariableTextarea({
    variables,
    onValueChange,
    className,
    value,
    onChange,
    onBlur,
    ...props
}: VariableTextareaProps) {
    const [showDropdown, setShowDropdown] = React.useState(false);
    const [selectedIndex, setSelectedIndex] = React.useState(0);
    const [searchTerm, setSearchTerm] = React.useState("");
    const [dropdownPos, setDropdownPos] = React.useState({ top: 0, left: 0 });
    const textareaRef = React.useRef<HTMLTextAreaElement>(null);
    const dropdownRef = React.useRef<HTMLDivElement>(null);

    const filteredVariables = variables.filter(v =>
        v.toLowerCase().includes(searchTerm.toLowerCase())
    );

    const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
        if (showDropdown && filteredVariables.length > 0) {
            if (e.key === "ArrowDown") {
                e.preventDefault();
                setSelectedIndex(prev => (prev + 1) % filteredVariables.length);
            } else if (e.key === "ArrowUp") {
                e.preventDefault();
                setSelectedIndex(prev => (prev - 1 + filteredVariables.length) % filteredVariables.length);
            } else if (e.key === "Enter" || e.key === "Tab") {
                e.preventDefault();
                insertVariable(filteredVariables[selectedIndex]);
            } else if (e.key === "Escape") {
                setShowDropdown(false);
            }
        }
    };

    const handleInput = (e: React.FormEvent<HTMLTextAreaElement>) => {
        const target = e.target as HTMLTextAreaElement;
        const val = target.value;
        const pos = target.selectionStart;

        // Check the text before cursor
        const textBeforeCursor = val.substring(0, pos);
        const lastSlashIndex = textBeforeCursor.lastIndexOf("/");

        if (lastSlashIndex !== -1) {
            const textSinceSlash = textBeforeCursor.substring(lastSlashIndex + 1);
            // If there's a space or newline after the slash, don't show dropdown
            if (!textSinceSlash.includes(" ") && !textSinceSlash.includes("\n")) {
                setSearchTerm(textSinceSlash);

                // Position logic: estimate position
                const lines = val.substring(0, lastSlashIndex).split("\n");
                const lineCount = lines.length;
                const charInLastLine = lines[lineCount - 1].length;

                // Very rough estimation of cursor position within textarea
                // For a more precise one we'd need a ghost element, but this is often enough for a simple UI
                const lineHeight = 20;
                const charWidth = 7;

                setDropdownPos({
                    top: Math.min(lineCount * lineHeight + 10, target.clientHeight - 40),
                    left: Math.min(charInLastLine * charWidth + 10, target.clientWidth - 150)
                });

                setShowDropdown(true);
                setSelectedIndex(0);
                return;
            }
        }
        setShowDropdown(false);
    };

    const insertVariable = (variable: string) => {
        if (!textareaRef.current) return;

        const val = textareaRef.current.value;
        const pos = textareaRef.current.selectionStart;
        const textBeforeCursor = val.substring(0, pos);
        const lastSlashIndex = textBeforeCursor.lastIndexOf("/");

        const newValue =
            val.substring(0, lastSlashIndex) +
            variable +
            val.substring(pos);

        if (onValueChange) {
            onValueChange(newValue);
        }

        // Also trigger the standard onChange if provided
        if (onChange) {
            const event = {
                target: { value: newValue }
            } as React.ChangeEvent<HTMLTextAreaElement>;
            onChange(event);
        }

        setShowDropdown(false);
        setSearchTerm("");

        // Refocus and set cursor after variable
        setTimeout(() => {
            if (textareaRef.current) {
                textareaRef.current.focus();
                const newPos = lastSlashIndex + variable.length;
                textareaRef.current.setSelectionRange(newPos, newPos);
            }
        }, 10);
    };

    React.useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
                setShowDropdown(false);
            }
        };
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, []);

    return (
        <div className="relative w-full group">
            <Textarea
                {...props}
                ref={textareaRef}
                value={value}
                onChange={onChange}
                onBlur={onBlur}
                onKeyDown={handleKeyDown}
                onInput={handleInput}
                className={cn("pr-10", className)}
            />

            {/* Helper Icon */}
            <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity">
                <div className="flex items-center gap-1 bg-slate-100 dark:bg-white/10 px-1.5 py-0.5 rounded text-[9px] font-bold text-slate-500 border border-slate-200 dark:border-white/5">
                    <span>/</span>
                    <span className="uppercase">Değişken</span>
                </div>
            </div>

            {showDropdown && filteredVariables.length > 0 && (
                <div
                    ref={dropdownRef}
                    className="absolute z-[100] w-56 bg-white dark:bg-[#111] border border-slate-200 dark:border-[#222] rounded-xl shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-150 border-t-primary/20"
                    style={{
                        top: `${dropdownPos.top}px`,
                        left: `${dropdownPos.left}px`,
                        marginTop: "20px"
                    }}
                >
                    <div className="bg-primary/5 px-3 py-2 border-b border-slate-100 dark:border-[#222] flex items-center justify-between">
                        <span className="text-[10px] font-bold text-primary uppercase tracking-wider">Değişken Seç</span>
                        <span className="text-[9px] text-muted-foreground font-medium">Ok tuşları + Enter</span>
                    </div>
                    <div className="p-1 max-h-[200px] overflow-y-auto scrollbar-thin scrollbar-thumb-slate-200 dark:scrollbar-thumb-[#333]">
                        {filteredVariables.map((v, i) => (
                            <button
                                key={v}
                                onClick={() => insertVariable(v)}
                                className={cn(
                                    "w-full text-left px-3 py-2 rounded-lg text-xs font-semibold transition-all flex items-center justify-between group/item",
                                    i === selectedIndex
                                        ? "bg-primary text-white shadow-lg shadow-primary/20 scale-[1.02]"
                                        : "hover:bg-slate-50 dark:hover:bg-white/5 text-slate-700 dark:text-slate-300"
                                )}
                                onMouseEnter={() => setSelectedIndex(i)}
                            >
                                <span className="font-mono">{v}</span>
                                <span className={cn(
                                    "text-[9px] transition-opacity",
                                    i === selectedIndex ? "text-white/80" : "text-muted-foreground opacity-0 group-hover/item:opacity-100"
                                )}>
                                    Seç
                                </span>
                            </button>
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
}
