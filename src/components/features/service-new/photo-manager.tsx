"use client";

import { useState, useRef, useCallback } from "react";
import {
    Camera,
    CloudUpload,
    Image as ImageIcon,
    Plus,
    X,
    ZoomIn,
    Trash
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";

export interface PhotoFile {
    id: string;
    dataUrl: string;
    name: string;
    size: number;
}

const MAX_PHOTOS = 6;
const MAX_SIZE_MB = 3;

interface PhotoManagerProps {
    photos: PhotoFile[];
    onAdd: (files: PhotoFile[]) => void;
    onRemove: (id: string) => void;
}

export function PhotoManager({ photos, onAdd, onRemove }: PhotoManagerProps) {
    const inputRef = useRef<HTMLInputElement>(null);
    const [isDragging, setIsDragging] = useState(false);
    const [lightboxSrc, setLightboxSrc] = useState<string | null>(null);
    const { toast } = useToast();

    const processFiles = useCallback(
        async (files: File[]) => {
            const remaining = MAX_PHOTOS - photos.length;
            if (remaining <= 0) {
                toast({ title: "Maksimum fotoğraf", description: `En fazla ${MAX_PHOTOS} fotoğraf eklenebilir.`, variant: "destructive" });
                return;
            }

            const toProcess = files.slice(0, remaining);
            const results: PhotoFile[] = [];

            for (const file of toProcess) {
                if (!file.type.startsWith("image/")) {
                    toast({ title: "Hatalı dosya", description: "Sadece görsel yükleyebilirsiniz.", variant: "destructive" });
                    continue;
                }

                if (file.size > MAX_SIZE_MB * 1024 * 1024) {
                    toast({ title: "Dosya çok büyük", description: `Maksimum boyut ${MAX_SIZE_MB}MB olmalıdır.`, variant: "destructive" });
                    continue;
                }

                const reader = new FileReader();
                const promise = new Promise<PhotoFile>((resolve) => {
                    reader.onload = (e) => {
                        resolve({
                            id: Math.random().toString(36).substring(7),
                            dataUrl: e.target?.result as string,
                            name: file.name,
                            size: file.size,
                        });
                    };
                    reader.readAsDataURL(file);
                });
                results.push(await promise);
            }

            onAdd(results);
        },
        [photos, onAdd, toast]
    );

    const handleDrop = (e: React.DragEvent) => {
        e.preventDefault();
        setIsDragging(false);
        processFiles(Array.from(e.dataTransfer.files));
    };

    return (
        <div className="space-y-4">
            <div className="flex items-center justify-between px-1">
                <label className="text-[10px] font-black text-muted-foreground/50 uppercase tracking-[0.2em]">
                    CİHAZ FOTOĞRAFLARI ({photos.length}/{MAX_PHOTOS})
                </label>
                {photos.length > 0 && (
                    <button
                        type="button"
                        onClick={() => photos.forEach(p => onRemove(p.id))}
                        className="text-[9px] font-black text-destructive/60 hover:text-destructive flex items-center gap-1 transition-colors"
                    >
                        <Trash className="h-3 w-3" /> TÜMÜNÜ SİL
                    </button>
                )}
            </div>

            <div
                onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
                onDragLeave={() => setIsDragging(false)}
                onDrop={handleDrop}
                className={cn(
                    "relative group cursor-pointer transition-all duration-500",
                    isDragging ? "scale-[0.99]" : ""
                )}
            >
                <div className={cn(
                    "relative min-h-[160px] rounded-[2.5rem] border-2 border-dashed border-white/5 bg-white/[0.02] overflow-hidden flex flex-col items-center justify-center p-6 transition-all duration-500",
                    isDragging ? "bg-primary/5 border-primary/30" : "group-hover:bg-white/[0.04] group-hover:border-white/10"
                )}>
                    {/* Animated Background Icons */}
                    <div className="absolute inset-0 opacity-[0.03] flex items-center justify-around pointer-events-none">
                        <Smartphone className="h-24 w-24 -rotate-12" />
                        <Camera className="h-32 w-32 rotate-12" />
                    </div>

                    <div className="relative flex flex-col items-center gap-4">
                        <div className="h-16 w-16 rounded-full bg-white/[0.03] flex items-center justify-center border border-white/5 group-hover:scale-110 group-hover:bg-primary/10 group-hover:border-primary/20 transition-all duration-500">
                            <CloudUpload className="h-8 w-8 text-muted-foreground/40 group-hover:text-primary transition-colors" />
                        </div>
                        <div className="text-center">
                            <p className="text-xs font-black text-foreground uppercase tracking-widest mb-1 group-hover:text-primary transition-colors">FOTOĞRAF YÜKLE</p>
                            <p className="text-[10px] font-medium text-muted-foreground/40">Sürükle bırak veya tıklayarak seç</p>
                        </div>
                    </div>
                    <input
                        ref={inputRef}
                        type="file"
                        multiple
                        accept="image/*"
                        className="hidden"
                        onChange={(e) => processFiles(Array.from(e.target.files || []))}
                    />
                    <button type="button" onClick={() => inputRef.current?.click()} className="absolute inset-0 w-full h-full cursor-pointer" />
                </div>
            </div>

            {photos.length > 0 && (
                <div className="grid grid-cols-3 sm:grid-cols-6 gap-3 animate-in fade-in slide-in-from-top-2 duration-500">
                    {photos.map((photo) => (
                        <div key={photo.id} className="relative aspect-square group/img rounded-2xl overflow-hidden bg-white/5 border border-white/5">
                            <img src={photo.dataUrl} alt="Device" className="w-full h-full object-cover transition-transform duration-700 group-hover/img:scale-110" />
                            <div className="absolute inset-0 bg-black/40 opacity-0 group-hover/img:opacity-100 transition-opacity flex items-center justify-center gap-2">
                                <button
                                    type="button"
                                    onClick={() => setLightboxSrc(photo.dataUrl)}
                                    className="h-8 w-8 rounded-full bg-white/10 hover:bg-white/20 backdrop-blur-md flex items-center justify-center transition-all"
                                >
                                    <ZoomIn className="h-4 w-4 text-white" />
                                </button>
                                <button
                                    type="button"
                                    onClick={() => onRemove(photo.id)}
                                    className="h-8 w-8 rounded-full bg-red-500/20 hover:bg-red-500/40 backdrop-blur-md flex items-center justify-center transition-all"
                                >
                                    <X className="h-4 w-4 text-red-500" />
                                </button>
                            </div>
                        </div>
                    ))}
                    {photos.length < MAX_PHOTOS && (
                        <button
                            type="button"
                            onClick={() => inputRef.current?.click()}
                            className="aspect-square rounded-2xl border-2 border-dashed border-white/5 bg-white/[0.01] hover:bg-white/[0.03] hover:border-white/10 flex items-center justify-center transition-all"
                        >
                            <Plus className="h-5 w-5 text-muted-foreground/30" />
                        </button>
                    )}
                </div>
            )}

            {/* Lightbox */}
            {lightboxSrc && (
                <div
                    className="fixed inset-0 z-[200] bg-black/90 backdrop-blur-xl flex items-center justify-center p-4 animate-in fade-in duration-300"
                    onClick={() => setLightboxSrc(null)}
                >
                    <button className="absolute top-8 right-8 text-white/40 hover:text-white transition-colors">
                        <X className="h-8 w-8" />
                    </button>
                    <img src={lightboxSrc} alt="Preview" className="max-w-full max-h-full rounded-2xl shadow-2xl animate-in zoom-in duration-300" />
                </div>
            )}
        </div>
    );
}

// Fixed missing Smartphone import by adding it to the list
import { Smartphone } from "lucide-react";
