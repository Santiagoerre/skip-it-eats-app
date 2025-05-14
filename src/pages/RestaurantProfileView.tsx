
import { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Star, Minus, Plus } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/components/ui/use-toast";
import { fetchRestaurantById, fetchMenuItems } from "@/services/restaurantService";
import { submitOrder } from "@/services/orderService";
import { useAuth } from "@/contexts/auth";
import { Restaurant } from "@/services/restaurantService";

interface CartItem {
  id: string;
  name: string;
  price: number;
  quantity: number;
}

interface MenuItem {
  id: string;
  name: string;
  description: string | null;
  price: number;
  category: string | null;
  image_url: string | null;
}

const RestaurantProfileView = () => {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const { toast } = useToast();
  const { user } = useAuth();
  
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [cart, setCart] = useState<CartItem[]>([]);
  const [restaurant, setRestaurant] = useState<Restaurant | null>(null);
  const [menuItems, setMenuItems] = useState<MenuItem[]>([]);
  const [menuCategories, setMenuCategories] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isPlacingOrder, setIsPlacingOrder] = useState(false);
  
  // Calculate cart total
  const cartTotal = cart.reduce((total, item) => total + (item.price * item.quantity), 0);

  // Fetch restaurant data and menu
  useEffect(() => {
    const loadRestaurantData = async () => {
      if (!id) return;
      
      setIsLoading(true);
      try {
        // Fetch restaurant details
        const restaurantData = await fetchRestaurantById(id);
        if (restaurantData) {
          setRestaurant(restaurantData);
        }
        
        // Fetch menu items
        const items = await fetchMenuItems(id);
        setMenuItems(items);
        
        // Extract unique categories
        const categories = Array.from(new Set(items.map(item => item.category || 'Uncategorized')));
        setMenuCategories(categories);
        
        // Set initial selected category
        if (categories.length > 0) {
          setSelectedCategory(categories[0]);
        }
      } catch (error) {
        console.error("Error loading restaurant data:", error);
        toast({
          title: "Error",
          description: "Could not load restaurant information",
          variant: "destructive",
        });
      } finally {
        setIsLoading(false);
      }
    };
    
    loadRestaurantData();
  }, [id, toast]);
  
  const addToCart = (item: { id: string; name: string; price: number }) => {
    setCart(prevCart => {
      const existingItem = prevCart.find(cartItem => cartItem.id === item.id);
      
      if (existingItem) {
        // Item exists, increment quantity
        return prevCart.map(cartItem => 
          cartItem.id === item.id 
            ? { ...cartItem, quantity: cartItem.quantity + 1 } 
            : cartItem
        );
      } else {
        // Item doesn't exist, add it
        return [...prevCart, { ...item, quantity: 1 }];
      }
    });
    
    toast({
      description: `${item.name} added to cart`,
      duration: 2000,
    });
  };
  
  const updateQuantity = (itemId: string, change: number) => {
    setCart(prevCart => {
      return prevCart.map(item => {
        if (item.id === itemId) {
          const newQuantity = Math.max(0, item.quantity + change);
          return { ...item, quantity: newQuantity };
        }
        return item;
      }).filter(item => item.quantity > 0); // Remove items with zero quantity
    });
  };
  
  const handlePlaceOrder = async () => {
    if (!user) {
      toast({
        title: "Sign in required",
        description: "Please sign in to place an order",
        variant: "destructive",
      });
      navigate("/signin");
      return;
    }
    
    if (cart.length === 0) {
      toast({
        title: "Empty Cart",
        description: "Please add items to your cart before placing an order",
        variant: "destructive",
      });
      return;
    }
    
    if (!restaurant || !id) {
      toast({
        title: "Error",
        description: "Restaurant information is missing",
        variant: "destructive",
      });
      return;
    }
    
    setIsPlacingOrder(true);
    
    try {
      // Format cart items for database
      const items = cart.map(item => ({
        name: item.name,
        quantity: item.quantity,
        price: item.price
      }));
      
      // Submit order to backend
      await submitOrder(
        user.id,
        id,
        user.email || "Customer",
        items,
        cartTotal
      );
      
      toast({
        title: "Order Placed!",
        description: "Your order has been placed successfully",
      });
      
      // Clear cart and navigate to orders page
      setCart([]);
      navigate("/app/orders");
    } catch (error) {
      console.error("Error placing order:", error);
      toast({
        title: "Order Failed",
        description: "Could not place your order. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsPlacingOrder(false);
    }
  };

  return (
    <div className="flex flex-col h-full">
      {/* Restaurant Banner */}
      <div className="relative h-40">
        <div className="absolute inset-0">
          <img 
            src={restaurant?.image_url || '/placeholder.svg'} 
            alt={restaurant?.name || 'Restaurant'}
            className="w-full h-full object-cover" 
          />
          {/* Dark overlay */}
          <div className="absolute inset-0 bg-black bg-opacity-40"></div>
        </div>
        
        {/* Back button and restaurant info */}
        <div className="relative p-4 flex flex-col h-full">
          <button 
            onClick={() => navigate("/app")}
            className="self-start bg-white bg-opacity-80 rounded-full p-2 mb-auto"
          >
            <ArrowLeft className="h-5 w-5" />
          </button>
          
          <div className="mt-auto text-white">
            <h1 className="text-2xl font-bold">{restaurant?.name}</h1>
            <div className="flex items-center mt-1 space-x-2">
              <span>{restaurant?.cuisine}</span>
              <span className="text-xs">•</span>
              <div className="flex items-center">
                <Star className="h-4 w-4 fill-yellow-400 text-yellow-400 mr-1" />
                <span>{restaurant?.rating || 'New'}</span>
              </div>
              <span className="text-xs">•</span>
              <span>{restaurant?.price_range}</span>
            </div>
          </div>
        </div>
      </div>
      
      {/* Menu Categories */}
      <div className="bg-white border-b overflow-x-auto">
        <div className="flex px-4 py-2 space-x-4">
          {menuCategories.map(category => (
            <button
              key={category}
              className={`whitespace-nowrap px-3 py-1 rounded-full text-sm ${
                selectedCategory === category 
                  ? "bg-skipit-primary text-white" 
                  : "bg-gray-100 text-gray-700"
              }`}
              onClick={() => setSelectedCategory(category)}
            >
              {category}
            </button>
          ))}
        </div>
      </div>
      
      {/* Menu Items */}
      <div className="flex-1 overflow-y-auto p-4 pb-24">
        {isLoading ? (
          <div className="text-center py-8">Loading menu...</div>
        ) : (
          <div className="space-y-6">
            {selectedCategory && (
              <div>
                <h2 className="text-lg font-semibold mb-4">{selectedCategory}</h2>
                <div className="space-y-4">
                  {menuItems
                    .filter(item => (item.category || 'Uncategorized') === selectedCategory)
                    .map(item => {
                      const cartItem = cart.find(cartItem => cartItem.id === item.id);
                      
                      return (
                        <Card key={item.id} className="overflow-hidden">
                          <CardContent className="p-0">
                            <div className="flex">
                              <div className="w-1/3 h-24 bg-muted">
                                <img
                                  src={item.image_url || '/placeholder.svg'}
                                  alt={item.name}
                                  className="h-full w-full object-cover"
                                />
                              </div>
                              <div className="w-2/3 p-3 flex flex-col justify-between">
                                <div>
                                  <h3 className="font-semibold">{item.name}</h3>
                                  <p className="text-muted-foreground text-xs line-clamp-2">{item.description}</p>
                                </div>
                                
                                <div className="flex justify-between items-center mt-2">
                                  <span className="font-medium">${item.price.toFixed(2)}</span>
                                  
                                  {cartItem ? (
                                    <div className="flex items-center space-x-2">
                                      <Button 
                                        size="icon" 
                                        variant="outline" 
                                        className="h-7 w-7"
                                        onClick={() => updateQuantity(item.id, -1)}
                                      >
                                        <Minus className="h-3 w-3" />
                                      </Button>
                                      <span className="w-4 text-center">{cartItem.quantity}</span>
                                      <Button 
                                        size="icon" 
                                        variant="outline" 
                                        className="h-7 w-7"
                                        onClick={() => updateQuantity(item.id, 1)}
                                      >
                                        <Plus className="h-3 w-3" />
                                      </Button>
                                    </div>
                                  ) : (
                                    <Button 
                                      size="sm" 
                                      onClick={() => addToCart(item)}
                                    >
                                      Add
                                    </Button>
                                  )}
                                </div>
                              </div>
                            </div>
                          </CardContent>
                        </Card>
                      );
                    })}
                </div>
              </div>
            )}
          </div>
        )}
      </div>
      
      {/* Cart Button (Fixed at Bottom) */}
      {cart.length > 0 && (
        <div className="fixed bottom-0 left-0 right-0 p-4 bg-white border-t shadow-md rounded-t-xl animate-slide-up">
          <Button 
            className="w-full py-6" 
            onClick={handlePlaceOrder}
            disabled={isPlacingOrder}
          >
            {isPlacingOrder ? 'Placing Order...' : `Place Order • $${cartTotal.toFixed(2)} • ${cart.reduce((total, item) => total + item.quantity, 0)} items`}
          </Button>
        </div>
      )}
    </div>
  );
};

export default RestaurantProfileView;
