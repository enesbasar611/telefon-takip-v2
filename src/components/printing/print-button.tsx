"use client";

import { Printer } from "lucide-react";
import { Button } from "@/components/ui/button";

export function PrintButton() {
  return (
    <Button
      onClick={() => window.print()}
      className="mt-10 bg-primary text-white p-2 h-auto rounded no-print text-[10px]  w-full"
    >
      <Printer className="mr-2 h-4 w-4" />
      FİŞİ YAZDIR
    </Button>
  );
}



