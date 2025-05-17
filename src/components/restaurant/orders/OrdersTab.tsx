
import { OrderProps } from "./OrderCard";
import OrderCard from "./OrderCard";
import EmptyState from "./EmptyState";
import { OrderStatus } from "./types";

interface OrdersTabProps {
  orders: OrderProps[];
  emptyMessage: string;
  onStatusUpdate: (orderId: string, status: OrderStatus) => void;
  onPreparationTimeUpdate?: (orderId: string, minutes: number) => void;
}

const OrdersTab = ({ orders, emptyMessage, onStatusUpdate, onPreparationTimeUpdate }: OrdersTabProps) => {
  return (
    <>
      {orders.length === 0 ? (
        <EmptyState message={emptyMessage} />
      ) : (
        orders.map(order => (
          <OrderCard 
            key={order.id} 
            {...order} 
            onStatusUpdate={onStatusUpdate}
            onPreparationTimeUpdate={onPreparationTimeUpdate}
          />
        ))
      )}
    </>
  );
};

export default OrdersTab;
