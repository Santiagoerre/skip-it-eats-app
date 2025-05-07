
import { useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Star, Minus, Plus } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/components/ui/use-toast";

// Mock data for a restaurant
const restaurantData = {
  id: 1,
  name: "Taco Truck Deluxe",
  cuisine: "Mexican",
  rating: 4.8,
  price: "$$",
  distance: "0.2 mi",
  description: "Authentic Mexican street food made with fresh ingredients. Known for our homemade salsas and hand-pressed tortillas.",
  imageUrl: "/lovable-uploads/da394ecb-aa2b-40dd-b48b-3d91161b0dac.png",
  menu: [
    {
      id: 1,
      category: "Popular Items",
      items: [
        { id: 101, name: "Chicken Burrito", description: "Flour tortilla filled with grilled chicken, rice, beans, and cheese", price: 8.99, imageUrl: "/lovable-uploads/da394ecb-aa2b-40dd-b48b-3d91161b0dac.png" },
        { id: 102, name: "Carne Asada Tacos", description: "Three corn tortillas with marinated steak, onion, and cilantro", price: 9.99, imageUrl: "/lovable-uploads/da394ecb-aa2b-40dd-b48b-3d91161b0dac.png" },
        { id: 103, name: "Chips & Guacamole", description: "Fresh homemade guacamole with crispy tortilla chips", price: 5.99, imageUrl: "/lovable-uploads/da394ecb-aa2b-40dd-b48b-3d91161b0dac.png" },
      ]
    },
    {
      id: 2,
      category: "Burritos",
      items: [
        { id: 201, name: "Chicken Burrito", description: "Flour tortilla filled with grilled chicken, rice, beans, and cheese", price: 8.99, imageUrl: "/lovable-uploads/da394ecb-aa2b-40dd-b48b-3d91161b0dac.png" },
        { id: 202, name: "Beef Burrito", description: "Flour tortilla filled with seasoned ground beef, rice, beans, and cheese", price: 9.99, imageUrl: "/lovable-uploads/da394ecb-aa2b-40dd-b48b-3d91161b0dac.png" },
        { id: 203, name: "Veggie Burrito", description: "Flour tortilla filled with grilled vegetables, rice, beans, and cheese", price: 7.99, imageUrl: "/lovable-uploads/da394ecb-aa2b-40dd-b48b-3d91161b0dac.png" },
      ]
    },
    {
      id: 3,
      category: "Tacos",
      items: [
        { id: 301, name: "Carne Asada Tacos", description: "Three corn tortillas with marinated steak, onion, and cilantro", price: 9.99, imageUrl: "/lovable-uploads/da394ecb-aa2b-40dd-b48b-3d91161b0dac.png" },
        { id: 302, name: "Chicken Tacos", description: "Three corn tortillas with grilled chicken, lettuce, and cheese", price: 8.99, imageUrl: "/lovable-uploads/da394ecb-aa2b-40dd-b48b-3d91161b0dac.png" },
        { id: 303, name: "Fish Tacos", description: "Three corn tortillas with crispy fish, cabbage slaw, and lime crema", price: 10.99, imageUrl: "/lovable-uploads/da394ecb-aa2b-40dd-b48b-3d91161b0dac.png" },
      ]
    },
    {
      id: 4,
      category: "Sides",
      items: [
        { id: 401, name: "Chips & Salsa", description: "Crispy tortilla chips with homemade salsa", price: 3.99, imageUrl: "/lovable-uploads/da394ecb-aa2b-40dd-b48b-3d91161b0dac.png" },
        { id: 402, name: "Chips & Guacamole", description: "Fresh homemade guacamole with crispy tortilla chips", price: 5.99, imageUrl: "/lovable-uploads/da394ecb-aa2b-40dd-b48b-3d91161b0dac.png" },
        { id: 403, name: "Mexican Rice", description: "Fluffy rice with tomatoes, onions, and spices", price: 2.99, imageUrl: "/lovable-uploads/da394ecb-aa2b-40dd-b48b-3d91161b0dac.png" },
      ]
    },
    {
      id: 5,
      category: "Drinks",
      items: [
        { id: 501, name: "Mexican Soda", description: "Imported Mexican soda in various flavors", price: 2.99, imageUrl: "/lovable-uploads/da394ecb-aa2b-40dd-b48b-3d91161b0dac.png" },
        { id: 502, name: "Horchata", description: "Sweet rice milk drink with cinnamon", price: 3.49, imageUrl: "/lovable-uploads/da394ecb-aa2b-40dd-b48b-3d91161b0dac.png" },
        { id: 503, name: "Agua Fresca", description: "Fresh fruit water in various flavors", price: 2.99, imageUrl: "/lovable-uploads/da394ecb-aa2b-40dd-b48b-3d91161b0dac.png" },
      ]
    }
  ]
};

interface CartItem {
  id: number;
  name: string;
  price: number;
  quantity: number;
}

const RestaurantProfileView = () => {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const { toast } = useToast();
  
  const [selectedCategory, setSelectedCategory] = useState("Popular Items");
  const [cart, setCart] = useState<CartItem[]>([]);
  
  // Find current restaurant (in a real app, would fetch from API)
  const restaurant = restaurantData; // Mock for now
  
  // Calculate cart total
  const cartTotal = cart.reduce((total, item) => total + (item.price * item.quantity), 0);
  
  const addToCart = (item: { id: number; name: string; price: number }) => {
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
  
  const updateQuantity = (itemId: number, change: number) => {
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
  
  const handlePlaceOrder = () => {
    if (cart.length === 0) {
      toast({
        title: "Empty Cart",
        description: "Please add items to your cart before placing an order",
        variant: "destructive",
      });
      return;
    }
    
    // In a real app, we would send the order to the backend here
    console.log("Placing order:", cart);
    
    toast({
      title: "Order Placed!",
      description: "Your order has been placed successfully",
    });
    
    // Clear cart and navigate to orders page
    setCart([]);
    navigate("/app/orders");
  };

  return (
    <div className="flex flex-col h-full">
      {/* Restaurant Banner */}
      <div className="relative h-40">
        <div className="absolute inset-0">
          <img 
            src={restaurant.imageUrl} 
            alt={restaurant.name}
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
            <h1 className="text-2xl font-bold">{restaurant.name}</h1>
            <div className="flex items-center mt-1 space-x-2">
              <span>{restaurant.cuisine}</span>
              <span className="text-xs">•</span>
              <div className="flex items-center">
                <Star className="h-4 w-4 fill-yellow-400 text-yellow-400 mr-1" />
                <span>{restaurant.rating}</span>
              </div>
              <span className="text-xs">•</span>
              <span>{restaurant.price}</span>
            </div>
          </div>
        </div>
      </div>
      
      {/* Menu Categories */}
      <div className="bg-white border-b overflow-x-auto">
        <div className="flex px-4 py-2 space-x-4">
          {restaurant.menu.map(category => (
            <button
              key={category.id}
              className={`whitespace-nowrap px-3 py-1 rounded-full text-sm ${
                selectedCategory === category.category 
                  ? "bg-skipit-primary text-white" 
                  : "bg-gray-100 text-gray-700"
              }`}
              onClick={() => setSelectedCategory(category.category)}
            >
              {category.category}
            </button>
          ))}
        </div>
      </div>
      
      {/* Menu Items */}
      <div className="flex-1 overflow-y-auto p-4 pb-24">
        <div className="space-y-6">
          {restaurant.menu
            .filter(category => category.category === selectedCategory)
            .map(category => (
              <div key={category.id}>
                <h2 className="text-lg font-semibold mb-4">{category.category}</h2>
                <div className="space-y-4">
                  {category.items.map(item => {
                    const cartItem = cart.find(cartItem => cartItem.id === item.id);
                    
                    return (
                      <Card key={item.id} className="overflow-hidden">
                        <CardContent className="p-0">
                          <div className="flex">
                            <div className="w-1/3 h-24 bg-muted">
                              <img
                                src={item.imageUrl}
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
            ))}
        </div>
      </div>
      
      {/* Cart Button (Fixed at Bottom) */}
      {cart.length > 0 && (
        <div className="fixed bottom-0 left-0 right-0 p-4 bg-white border-t shadow-md rounded-t-xl animate-slide-up">
          <Button 
            className="w-full py-6" 
            onClick={handlePlaceOrder}
          >
            Place Order • ${cartTotal.toFixed(2)} • {cart.reduce((total, item) => total + item.quantity, 0)} items
          </Button>
        </div>
      )}
    </div>
  );
};

export default RestaurantProfileView;
