
import { OrderProps } from "./OrderCard";
import { OrderStatus } from "./types";

// Mock data for orders - will be replaced with real API calls
export const mockOrders: OrderProps[] = [
  {
    id: "1",
    customer: "John Doe",
    items: [
      { name: "Burger", quantity: 1, price: 12.99 },
      { name: "Fries", quantity: 1, price: 3.99 },
      { name: "Soda", quantity: 1, price: 1.99 }
    ],
    total: 18.97,
    status: "pending" as OrderStatus,
    time: "Today, 5:30 PM",
    specialInstructions: "No onions on the burger please",
    onStatusUpdate: () => {}
  },
  {
    id: "2",
    customer: "Jane Smith",
    items: [
      { name: "Pizza", quantity: 1, price: 14.99 },
      { name: "Breadsticks", quantity: 1, price: 4.99 }
    ],
    total: 19.98,
    status: "confirmed" as OrderStatus,
    time: "Today, 5:15 PM",
    onStatusUpdate: () => {}
  },
  {
    id: "3",
    customer: "Alice Johnson",
    items: [
      { name: "Salad", quantity: 1, price: 9.99 },
      { name: "Iced Tea", quantity: 1, price: 2.99 }
    ],
    total: 12.98,
    status: "completed" as OrderStatus,
    time: "Today, 4:30 PM",
    onStatusUpdate: () => {}
  }
];
