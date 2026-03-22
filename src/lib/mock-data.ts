import { ServiceStatus } from "@prisma/client";

export const mockTickets = [
  {
    id: "1",
    ticketNumber: "SRV-1001",
    status: ServiceStatus.PENDING,
    createdAt: new Date(),
    deviceBrand: "Apple",
    deviceModel: "iPhone 13",
    imei: "351234567890123",
    problemDesc: "Ekran kırık, görüntü gelmiyor.",
    estimatedCost: 1500,
    customer: {
      name: "Ali Yılmaz",
      phone: "0532 123 45 67",
    },
  },
  {
    id: "2",
    ticketNumber: "SRV-1002",
    status: ServiceStatus.REPAIRING,
    createdAt: new Date(Date.now() - 86400000),
    deviceBrand: "Samsung",
    deviceModel: "Galaxy S21",
    imei: "359876543210987",
    problemDesc: "Şarj soketi değişimi yapılacak.",
    estimatedCost: 450,
    customer: {
      name: "Ayşe Demir",
      phone: "0544 987 65 43",
    },
  },
  {
    id: "3",
    ticketNumber: "SRV-1003",
    status: ServiceStatus.READY,
    createdAt: new Date(Date.now() - 172800000),
    deviceBrand: "Xiaomi",
    deviceModel: "Redmi Note 10 Pro",
    imei: "867451236985472",
    problemDesc: "Batarya değişimi yapıldı.",
    estimatedCost: 600,
    customer: {
      name: "Mehmet Kaya",
      phone: "0555 444 33 22",
    },
  },
];
