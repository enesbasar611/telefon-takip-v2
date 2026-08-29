import { Metadata } from "next";
import { ScannerClient } from "./scanner-client";

export const metadata: Metadata = {
  title: "Barkod & Karekod Tarayıcı | Başar Teknik",
  description: "Mobil barkod ve QR kod tarayıcı ile hızlı stok ve satış yönetimi.",
};

export default function MobileScannerPage() {
  return <ScannerClient />;
}
