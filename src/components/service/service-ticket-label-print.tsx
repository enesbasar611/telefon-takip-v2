"use client";

import { useEffect, useRef, type CSSProperties } from "react";
import { Barcode } from "@/components/barcode/barcode";
import { formatCurrency } from "@/lib/utils";

export interface ServiceTicketLabelData {
  ticketNumber: string;
  customerName: string;
  customerPhone: string;
  deviceBrand: string;
  deviceModel: string;
  estimatedCost: number;
  createdAt: string | Date;
  shopName: string;
  shopPhone?: string;
  shopAddress?: string;
}

export function buildServiceTicketLabelData(ticket: any, shop?: any): ServiceTicketLabelData {
  return {
    ticketNumber: ticket?.ticketNumber || "",
    customerName: ticket?.customer?.name || ticket?.customerName || "-",
    customerPhone: ticket?.customer?.phone || ticket?.customerPhone || "-",
    deviceBrand: ticket?.deviceBrand || "GENEL",
    deviceModel: ticket?.deviceModel || "",
    estimatedCost: Number(ticket?.estimatedCost ?? ticket?.actualCost ?? 0),
    createdAt: ticket?.createdAt || new Date().toISOString(),
    shopName: shop?.name || shop?.companyName || "BAŞAR TEKNİK",
    shopPhone: shop?.phone || "",
    shopAddress: shop?.address || shop?.companyAddress || "",
  };
}

interface ServiceTicketLabelPrintAreaProps {
  label: ServiceTicketLabelData | null;
  onPrinted?: () => void;
}

export function ServiceTicketLabelPrintArea({ label, onPrinted }: ServiceTicketLabelPrintAreaProps) {
  const printAreaRef = useRef<HTMLDivElement | null>(null);
  const onPrintedRef = useRef(onPrinted);

  useEffect(() => {
    onPrintedRef.current = onPrinted;
  }, [onPrinted]);

  useEffect(() => {
    if (!label) return;

    const printLabel = () => {
      const printRoot = printAreaRef.current?.cloneNode(true) as HTMLElement | null;
      const printStyle = document.createElement("style");
      let cleaned = false;

      const cleanup = () => {
        if (cleaned) return;
        cleaned = true;
        document.body.classList.remove("barcode-label-printing");
        document.body.classList.remove("service-ticket-label-printing");
        printStyle.remove();
        printRoot?.remove();
        window.removeEventListener("afterprint", cleanup);
        onPrintedRef.current?.();
      };

      printStyle.setAttribute("data-service-ticket-label-page", "true");
      printStyle.textContent = "@media print { @page { size: 60mm 30mm; margin: 0; } }";
      document.head.appendChild(printStyle);

      if (printRoot) {
        printRoot.classList.add("barcode-print-root");
        document.body.appendChild(printRoot);
      }

      document.body.classList.add("barcode-label-printing");
      document.body.classList.add("service-ticket-label-printing");
      window.addEventListener("afterprint", cleanup);
      window.print();
      window.setTimeout(cleanup, 10000);
    };

    const timer = window.setTimeout(printLabel, 350);
    return () => window.clearTimeout(timer);
  }, [label]);

  if (!label) return null;

  return (
    <div className="hidden">
      <div
        ref={printAreaRef}
        className="service-ticket-label-print-area barcode-print-area"
        style={{
          "--barcode-label-width": "60mm",
          "--barcode-label-height": "30mm",
          "--barcode-a4-columns": 1,
          "--barcode-a4-padding": "0mm",
          "--barcode-label-gap": "0mm",
        } as CSSProperties}
      >
        <div className="barcode-print-page barcode-print-page-single bg-white">
          <div className="service-ticket-label barcode-label">
            <div className="service-ticket-label-code">
              <div className="service-ticket-label-shop">{label.shopName}</div>
              {label.shopPhone && (
                <div className="service-ticket-label-shop-sub">{label.shopPhone}</div>
              )}
              <Barcode value={label.ticketNumber} width={0.58} height={11} fontSize={6} displayValue={false} />
              <div className="service-ticket-label-ticket">{label.ticketNumber}</div>
            </div>
            <div className="service-ticket-label-grid">
              <span>Fiş</span>
              <strong>{label.ticketNumber}</strong>
              <span>Müşteri</span>
              <strong>{label.customerName}</strong>
              <span>Telefon</span>
              <strong>{label.customerPhone}</strong>
              <span>Cihaz</span>
              <strong>{label.deviceBrand} {label.deviceModel}</strong>
              <span>Fiyat</span>
              <strong>{formatCurrency(label.estimatedCost)} TL</strong>
              <span>Alış</span>
              <strong>{new Date(label.createdAt).toLocaleString("tr-TR")}</strong>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
