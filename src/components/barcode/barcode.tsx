"use client";

import dynamic from "next/dynamic";

const BarcodeComponent = dynamic(() => import("react-barcode"), { ssr: false });

interface BarcodeProps {
  value: string;
  width?: number;
  height?: number;
  fontSize?: number;
  displayValue?: boolean;
}

export function Barcode({ value, width = 2, height = 50, fontSize = 12, displayValue = true }: BarcodeProps) {
  if (!value) return null;

  return (
    <div className="flex justify-center p-2 bg-white">
      <BarcodeComponent
        value={value}
        width={width}
        height={height}
        fontSize={fontSize}
        format="CODE128"
        displayValue={displayValue}
      />
    </div>
  );
}



