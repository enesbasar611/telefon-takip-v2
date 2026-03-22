import { Construction } from "lucide-react";

export default function SatisPage() {
  return (
    <div className="flex flex-col items-center justify-center h-[70vh] gap-4 text-center">
      <div className="bg-primary/10 p-6 rounded-full">
        <Construction className="h-12 w-12 text-primary" />
      </div>
      <h1 className="text-3xl font-bold tracking-tight">Satış ve Kasa (POS)</h1>
      <p className="text-muted-foreground text-lg max-w-md">
        Bu modül şu anda geliştirme aşamasındadır. Çok yakında hizmetinizde olacak.
      </p>
    </div>
  );
}
