"use client";

import { industries, IndustryType } from "@/config/industries";

interface IndustryBackgroundProps {
    industry: IndustryType;
}

export function IndustryBackground({ industry }: IndustryBackgroundProps) {
    const industryConfig = industries[industry] || industries.GENERAL;

    return (
        <div className="fixed inset-0 -z-10 overflow-hidden pointer-events-none bg-background">
            {/* Minimal Subtle Glows */}
            <div className={`absolute top-[-10%] right-[-5%] w-[40%] h-[40%] blur-[120px] rounded-full opacity-[0.1]
                ${industry === 'PHONE_REPAIR' ? 'bg-blue-600' :
                    industry === 'ELECTRICIAN' ? 'bg-amber-500' :
                        industry === 'GROCERY' ? 'bg-emerald-500' :
                            industry === 'CLOTHING' ? 'bg-rose-500' :
                                industry === 'COMPUTER_REPAIR' ? 'bg-indigo-500' :
                                    industry === 'AUTOMOTIVE' ? 'bg-orange-500' :
                                        industry === 'BARBER' ? 'bg-purple-600' :
                                            industry === 'PLUMBING' ? 'bg-cyan-500' : 'bg-slate-500'}`}
            />
            <div className={`absolute bottom-[-10%] left-[-5%] w-[40%] h-[40%] blur-[120px] rounded-full opacity-[0.1]
                ${industry === 'PHONE_REPAIR' ? 'bg-indigo-600' :
                    industry === 'ELECTRICIAN' ? 'bg-orange-600' :
                        industry === 'GROCERY' ? 'bg-green-600' :
                            industry === 'CLOTHING' ? 'bg-pink-600' :
                                industry === 'COMPUTER_REPAIR' ? 'bg-blue-600' :
                                    industry === 'AUTOMOTIVE' ? 'bg-red-600' :
                                        industry === 'BARBER' ? 'bg-pink-500' :
                                            industry === 'PLUMBING' ? 'bg-blue-400' : 'bg-gray-600'}`}
            />

            {/* Texture overlay */}
            <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/carbon-fibre.png')] opacity-[0.01] pointer-events-none" />
        </div>
    );
}
