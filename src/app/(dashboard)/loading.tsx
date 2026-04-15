import { Loader2 } from "lucide-react";
import { BorderBeam } from "@/components/ui/border-beam";

export default function Loading() {
    return (
        <div className="relative w-full h-[60vh] flex flex-col items-center justify-center gap-6 overflow-hidden rounded-[4rem]">
            <BorderBeam duration={4} size={300} />
            <div className="relative">
                <div className="absolute inset-0 bg-primary/20 blur-3xl rounded-full scale-150 animate-pulse" />
                <div className="h-20 w-20 rounded-full border-4 border-muted flex items-center justify-center relative bg-background/50 backdrop-blur-xl">
                    <Loader2 className="h-10 w-10 text-primary animate-spin" />
                </div>
            </div>
            <div className="flex flex-col items-center gap-2">
                <span className="text-sm font-light tracking-[0.3em] uppercase text-primary animate-pulse">Yükleniyor</span>
                <div className="flex gap-1">
                    <div className="h-1 w-1 rounded-full bg-primary/40 animate-bounce [animation-delay:-0.3s]" />
                    <div className="h-1 w-1 rounded-full bg-primary/40 animate-bounce [animation-delay:-0.15s]" />
                    <div className="h-1 w-1 rounded-full bg-primary/40 animate-bounce" />
                </div>
            </div>
        </div>
    );
}



