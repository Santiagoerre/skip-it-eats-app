
import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { ArrowLeft, Clock, MapPin, Phone } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Separator } from "@/components/ui/separator";
import { fetchRestaurantById } from "@/services/restaurantService"; // Fixed import name
import { getMenuItemsByRestaurant } from "@/services/menuService";
import { Tabs, TabsList, TabsContent } from "@/components/ui/tabs"; // Fixed component names
import MenuItemDetails from "@/components/restaurant/customer/MenuItemDetails";
import CartSummary from "@/components/restaurant/customer/CartSummary";

// Define MenuItem interface based on existing types
interface MenuItem {
  id: string;
  name: string;
  description: string;
  price: number;
  category: string;
  image_url?: string;
}

// Define OrderItem interface to match MenuItemDetails component expectations
interface OrderItem {
  id: string;
  name: string;
  price: number;
}

const RestaurantProfileView = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [restaurant, setRestaurant] = useState<any>(null);
  const [menuItems, setMenuItems] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedItem, setSelectedItem] = useState<any | null>(null);
  const [cartItems, setCartItems] = useState<any[]>([]);
  const [cartTotal, setCartTotal] = useState(0);
  
  useEffect(() => {
    const fetchRestaurantData = async () => {
      if (!id) return;
      
      try {
        console.log("Fetching restaurant by ID:", id);
        const restaurantData = await fetchRestaurantById(id);
        setRestaurant(restaurantData);
        
        const menuData = await getMenuItemsByRestaurant(id);
        setMenuItems(menuData);
      } catch (error) {
        console.error("Error fetching restaurant data:", error);
      } finally {
        setLoading(false);
      }
    };
    
    fetchRestaurantData();
  }, [id]);
  
  const addToCart = (item: OrderItem, quantity: number, selectedOptions: any[] = []) => {
    // Calculate price with options
    let totalItemPrice = item.price;
    let optionsFormatted = [];
    
    if (selectedOptions.length > 0) {
      optionsFormatted = selectedOptions.map(group => {
        const selections = group.selections.map((selection: any) => {
          totalItemPrice += selection.priceAdjustment;
          return {
            name: selection.name,
            priceAdjustment: selection.priceAdjustment
          };
        });
        
        return {
          groupName: group.groupName,
          selections
        };
      });
    }
    
    const newItem = {
      id: item.id,
      name: item.name,
      price: totalItemPrice,
      quantity,
      options: optionsFormatted.length > 0 ? optionsFormatted : undefined
    };
    
    setCartItems(prev => {
      // Check if an identical item (including same options) already exists
      let exists = false;
      
      const updated = prev.map(cartItem => {
        // This is a very simplistic check and might need improvement for real apps
        if (cartItem.id === item.id && 
            JSON.stringify(cartItem.options) === JSON.stringify(newItem.options)) {
          exists = true;
          return { ...cartItem, quantity: cartItem.quantity + quantity };
        }
        return cartItem;
      });
      
      if (!exists) {
        return [...updated, newItem];
      }
      
      return updated;
    });
    
    // Close the item details dialog
    setSelectedItem(null);
  };
  
  // Calculate cart total whenever cartItems changes
  useEffect(() => {
    const newTotal = cartItems.reduce((sum, item) => {
      return sum + (item.price * item.quantity);
    }, 0);
    
    setCartTotal(newTotal);
  }, [cartItems]);
  
  const clearCart = () => {
    setCartItems([]);
    setCartTotal(0);
  };
  
  // Group menu items by category
  const menuByCategory = menuItems.reduce((acc, item) => {
    const category = item.category || 'Other';
    if (!acc[category]) {
      acc[category] = [];
    }
    acc[category].push(item);
    return acc;
  }, {});
  
  const categories = Object.keys(menuByCategory);
  
  return (
    <div className="pb-20">
      {/* Back button */}
      <div className="p-4">
        <Button variant="ghost" size="icon" onClick={() => navigate(-1)}>
          <ArrowLeft className="h-5 w-5" />
        </Button>
      </div>
      
      {/* Restaurant header */}
      {loading ? (
        <div className="p-4 space-y-4">
          <Skeleton className="h-40 w-full" />
          <Skeleton className="h-8 w-3/4" />
          <Skeleton className="h-6 w-1/2" />
        </div>
      ) : restaurant ? (
        <>
          <div className="relative h-40 bg-muted overflow-hidden">
            {restaurant.image_url ? (
              <img
                src={restaurant.image_url}
                alt={restaurant.name}
                className="w-full h-full object-cover"
              />
            ) : (
              <div className="flex items-center justify-center h-full bg-gradient-to-r from-purple-400 to-purple-600">
                <span className="text-2xl font-bold text-white">
                  {restaurant.name}
                </span>
              </div>
            )}
          </div>
          
          <div className="p-4">
            <h1 className="text-2xl font-bold">{restaurant.name}</h1>
            
            <div className="flex items-center mt-2 text-muted-foreground">
              <Badge variant="outline" className="mr-2">
                {restaurant.cuisine || "Various Cuisine"}
              </Badge>
              <Badge variant="outline">{restaurant.price_range || "$"}</Badge>
            </div>
            
            <p className="mt-3 text-muted-foreground">
              {restaurant.description || "No description available."}
            </p>
            
            {restaurant.location && (
              <div className="mt-4 flex items-start space-x-6 text-sm">
                <div className="flex items-center">
                  <MapPin className="h-4 w-4 mr-1 text-muted-foreground" />
                  <span>{restaurant.location.address}</span>
                </div>
                
                <div className="flex items-center">
                  <Clock className="h-4 w-4 mr-1 text-muted-foreground" />
                  <span>Open now</span>
                </div>
                
                <div className="flex items-center">
                  <Phone className="h-4 w-4 mr-1 text-muted-foreground" />
                  <span>Contact</span>
                </div>
              </div>
            )}
          </div>
          
          <Separator className="my-2" />
          
          {/* Menu */}
          <div className="p-4">
            <h2 className="text-xl font-semibold mb-4">Menu</h2>
            
            {menuItems.length === 0 ? (
              <div className="text-center p-6 bg-muted rounded-lg">
                <p>No menu items available for this restaurant.</p>
              </div>
            ) : (
              <Tabs defaultValue={categories[0]}>
                <TabsList className="mb-4 overflow-x-auto pb-2 flex space-x-2">
                  {categories.map((category) => (
                    <Button 
                      key={category} 
                      variant={categories[0] === category ? "default" : "outline"}
                      onClick={() => {
                        // Implement tab switching logic here if needed
                      }}
                      className="whitespace-nowrap"
                    >
                      {category}
                    </Button>
                  ))}
                </TabsList>
                
                {categories.map((category) => (
                  <TabsContent key={category} value={category}>
                    <div className="space-y-3">
                      {menuByCategory[category].map((item: any) => (
                        <Card 
                          key={item.id} 
                          className="p-3 cursor-pointer"
                          onClick={() => setSelectedItem(item)}
                        >
                          <div className="flex justify-between">
                            <div>
                              <h3 className="font-medium">{item.name}</h3>
                              <p className="text-sm text-muted-foreground line-clamp-2">
                                {item.description}
                              </p>
                            </div>
                            <div className="ml-4 flex-shrink-0">
                              <span className="font-semibold">${item.price.toFixed(2)}</span>
                            </div>
                          </div>
                        </Card>
                      ))}
                    </div>
                  </TabsContent>
                ))}
              </Tabs>
            )}
          </div>
        </>
      ) : (
        <div className="p-4 text-center">
          <p>Restaurant not found.</p>
          <Button className="mt-4" onClick={() => navigate("/app")}>
            Go back to restaurants
          </Button>
        </div>
      )}
      
      {/* Item detail modal */}
      {selectedItem && (
        <MenuItemDetails
          item={selectedItem}
          onClose={() => setSelectedItem(null)}
          onAddToCart={addToCart}
        />
      )}
      
      {/* Cart summary */}
      <CartSummary 
        items={cartItems}
        total={cartTotal}
        restaurantId={id || ''}
        restaurantName={restaurant?.name || ''}
        onClearCart={clearCart}
      />
    </div>
  );
};

export default RestaurantProfileView;
