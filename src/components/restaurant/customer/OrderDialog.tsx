
import { useState } from "react";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { useAuth } from "@/contexts/auth";
import { useToast } from "@/components/ui/use-toast";
import { submitOrder } from "@/services/orderService";
import ScheduleOrderPicker from "./ScheduleOrderPicker";

interface OrderDialogProps {
  isOpen: boolean;
  onClose: () => void;
  restaurantId: string;
  restaurantName: string;
  orderItems: any[];
  orderTotal: number;
  onSuccess: () => void;
}

const OrderDialog = ({
  isOpen,
  onClose,
  restaurantId,
  restaurantName,
  orderItems,
  orderTotal,
  onSuccess,
}: OrderDialogProps) => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [specialInstructions, setSpecialInstructions] = useState("");
  const [scheduledDate, setScheduledDate] = useState<Date | null>(null);

  const handleSubmit = async () => {
    if (!user) {
      toast({
        title: "Not logged in",
        description: "You need to be logged in to place an order",
        variant: "destructive",
      });
      return;
    }

    setIsSubmitting(true);

    try {
      const scheduledTimeString = scheduledDate ? scheduledDate.toISOString() : undefined;
      
      await submitOrder(
        user.id,
        restaurantId,
        user.email || "Customer",
        orderItems,
        orderTotal,
        specialInstructions || undefined,
        scheduledTimeString
      );

      toast({
        title: "Order Placed!",
        description: scheduledDate 
          ? `Your order has been scheduled for ${scheduledDate.toLocaleString()}` 
          : "Your order has been sent to the restaurant",
      });

      onSuccess();
      onClose();
    } catch (error) {
      console.error("Error placing order:", error);
      toast({
        title: "Order Failed",
        description: "There was a problem placing your order",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Confirm Your Order</DialogTitle>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div>
            <h3 className="font-medium mb-2">Order Summary</h3>
            <div className="bg-muted p-3 rounded-md text-sm">
              <div className="space-y-1 mb-2">
                {orderItems.map((item, index) => (
                  <div key={index} className="flex justify-between">
                    <span>{item.quantity}x {item.name}</span>
                    <span>${(item.price * item.quantity).toFixed(2)}</span>
                  </div>
                ))}
              </div>
              <div className="border-t pt-2 font-medium flex justify-between">
                <span>Total:</span>
                <span>${orderTotal.toFixed(2)}</span>
              </div>
            </div>
          </div>

          <div>
            <Label htmlFor="special-instructions" className="text-sm font-medium">
              Special Instructions (optional)
            </Label>
            <Textarea
              id="special-instructions"
              placeholder="Add any special instructions or notes for your order..."
              value={specialInstructions}
              onChange={(e) => setSpecialInstructions(e.target.value)}
              className="mt-1"
            />
          </div>
          
          <ScheduleOrderPicker onScheduleChange={setScheduledDate} />
        </div>

        <DialogFooter className="sm:justify-end">
          <Button variant="outline" onClick={onClose} disabled={isSubmitting}>
            Cancel
          </Button>
          <Button onClick={handleSubmit} disabled={isSubmitting}>
            {isSubmitting ? "Placing Order..." : "Place Order"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default OrderDialog;
