import { pickReturnProductName } from "../src/lib/returns/return-product-name";

function assert(condition: unknown, message: string) {
  if (!condition) throw new Error(message);
}

assert(
  pickReturnProductName({ productName: "Kayitli urun adi" }) === "Kayitli urun adi",
  "Stored return product name should win."
);

assert(
  pickReturnProductName({ product: { name: "Stok urunu" } }) === "Stok urunu",
  "Stock product name should be used."
);

assert(
  pickReturnProductName({ debt: { notes: "Stok disi veresiye kalemi" } }) === "Stok disi veresiye kalemi",
  "Debt notes should be used for stockless debt returns."
);

assert(
  pickReturnProductName({
    sale: {
      items: [
        { product: { name: "Ekran" }, quantity: 1 },
        { product: { name: "Batarya" }, quantity: 2 },
      ],
    },
  }) === "Ekran, Batarya",
  "Sale item product names should be joined."
);

console.log("return-product-name tests passed");
