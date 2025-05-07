import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { ArrowLeft, Clock, CheckCircle, LogOut, Edit, Trash, Plus, Upload } from "lucide-react";
import { useToast } from "@/components/ui/use-toast";

// Mock data for incoming orders
const incomingOrders = [
  {
    id: 1,
    customerName: "Jane Smith",
    items: ["Chicken Burrito", "Chips & Salsa"],
    totalPrice: "$15.99",
    status: "New",
    pickupTime: "12:30 PM",
  },
  {
    id: 2,
    customerName: "Mike Johnson",
    items: ["Beef Tacos (3)", "Mexican Soda"],
    totalPrice: "$14.50",
    status: "Preparing",
    pickupTime: "12:45 PM",
  },
];

// Mock data for menu items
const initialMenuItems = [
  {
    id: 1,
    name: "Chicken Burrito",
    description: "Flour tortilla filled with grilled chicken, rice, beans, and cheese",
    price: 8.99,
    imageUrl: "/lovable-uploads/da394ecb-aa2b-40dd-b48b-3d91161b0dac.png",
    category: "Burritos"
  },
  {
    id: 2,
    name: "Carne Asada Tacos",
    description: "Three corn tortillas with marinated steak, onion, and cilantro",
    price: 9.99,
    imageUrl: "/lovable-uploads/da394ecb-aa2b-40dd-b48b-3d91161b0dac.png",
    category: "Tacos"
  },
  {
    id: 3,
    name: "Chips & Guacamole",
    description: "Fresh homemade guacamole with crispy tortilla chips",
    price: 5.99,
    imageUrl: "/lovable-uploads/da394ecb-aa2b-40dd-b48b-3d91161b0dac.png",
    category: "Sides"
  },
];

interface MenuItem {
  id: number;
  name: string;
  description: string;
  price: number;
  imageUrl: string;
  category: string;
}

const RestaurantDashboard = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState("orders");
  const [menuItems, setMenuItems] = useState<MenuItem[]>(initialMenuItems);
  const [newMenuItem, setNewMenuItem] = useState<Omit<MenuItem, "id"> & { id?: number }>({
    name: "",
    description: "",
    price: 0,
    imageUrl: "/lovable-uploads/da394ecb-aa2b-40dd-b48b-3d91161b0dac.png", // Default image
    category: ""
  });
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [dialogOpen, setDialogOpen] = useState(false);
  
  const handleSignOut = () => {
    navigate("/");
  };
  
  const handleOrderStatusChange = (orderId: number, newStatus: string) => {
    // In a real app, we would update the order status with the backend here
    console.log(`Updating order ${orderId} status to ${newStatus}`);
    
    toast({
      description: `Order status updated to ${newStatus}`,
    });
  };
  
  const resetMenuItemForm = () => {
    setNewMenuItem({
      name: "",
      description: "",
      price: 0,
      imageUrl: "/lovable-uploads/da394ecb-aa2b-40dd-b48b-3d91161b0dac.png",
      category: ""
    });
    setImagePreview(null);
    setIsEditing(false);
  };
  
  const handleOpenAddDialog = () => {
    resetMenuItemForm();
    setDialogOpen(true);
  };
  
  const handleOpenEditDialog = (item: MenuItem) => {
    setNewMenuItem(item);
    setImagePreview(item.imageUrl);
    setIsEditing(true);
    setDialogOpen(true);
  };
  
  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      
      // Create a preview URL
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreview(reader.result as string);
      };
      reader.readAsDataURL(file);
      
      // In a real app, we would upload the image to a server and get a URL back
      // For now, we'll just keep the default image URL
    }
  };
  
  const handleSaveMenuItem = () => {
    if (!newMenuItem.name || !newMenuItem.category || newMenuItem.price <= 0) {
      toast({
        title: "Missing information",
        description: "Please fill out all required fields",
        variant: "destructive",
      });
      return;
    }
    
    if (isEditing && newMenuItem.id) {
      // Update existing item
      setMenuItems(prevItems => 
        prevItems.map(item => 
          item.id === newMenuItem.id ? { ...newMenuItem as MenuItem } : item
        )
      );
      
      toast({
        description: `${newMenuItem.name} has been updated`,
      });
    } else {
      // Add new item
      const newId = Math.max(0, ...menuItems.map(item => item.id)) + 1;
      
      setMenuItems(prevItems => [
        ...prevItems,
        { ...newMenuItem, id: newId } as MenuItem
      ]);
      
      toast({
        description: `${newMenuItem.name} has been added to your menu`,
      });
    }
    
    setDialogOpen(false);
    resetMenuItemForm();
  };
  
  const handleDeleteMenuItem = (id: number) => {
    setMenuItems(prevItems => prevItems.filter(item => item.id !== id));
    
    toast({
      description: "Item has been removed from your menu",
    });
  };
  
  return (
    <div className="mobile-container app-height flex flex-col">
      <header className="p-4 border-b flex justify-between items-center bg-white">
        <h1 className="text-xl font-bold">Restaurant Dashboard</h1>
        <Button 
          variant="ghost" 
          size="icon"
          onClick={handleSignOut}
        >
          <LogOut className="h-5 w-5" />
        </Button>
      </header>
      
      <div className="p-4 bg-skipit-light">
        <div className="flex justify-between items-center">
          <div>
            <h2 className="font-semibold">Taco Truck Deluxe</h2>
            <p className="text-sm text-muted-foreground">Mexican Cuisine</p>
          </div>
          <div className="text-sm bg-green-100 text-green-700 px-3 py-1 rounded-full">
            Open
          </div>
        </div>
      </div>
      
      <Tabs 
        defaultValue="orders" 
        onValueChange={setActiveTab}
        className="flex-1 flex flex-col"
      >
        <TabsList className="grid grid-cols-2 p-0 h-auto">
          <TabsTrigger value="orders" className="py-3 rounded-none">
            Incoming Orders
          </TabsTrigger>
          <TabsTrigger value="menu" className="py-3 rounded-none">
            Menu
          </TabsTrigger>
        </TabsList>
        
        <TabsContent value="orders" className="flex-1 overflow-y-auto p-4 space-y-4">
          {incomingOrders.map((order) => (
            <Card key={order.id}>
              <CardContent className="p-3">
                <div className="flex justify-between mb-2">
                  <h3 className="font-semibold">{order.customerName}</h3>
                  <span className={`text-sm font-medium ${
                    order.status === "New" ? "text-blue-600" :
                    order.status === "Preparing" ? "text-orange-600" :
                    "text-green-600"
                  }`}>
                    {order.status}
                  </span>
                </div>
                
                <p className="text-sm text-muted-foreground mb-2">
                  {order.items.join(", ")}
                </p>
                
                <div className="flex justify-between items-center">
                  <div className="text-sm">
                    <span className="text-muted-foreground">Pickup: </span>
                    <span className="font-medium">{order.pickupTime}</span>
                  </div>
                  <span className="font-medium">{order.totalPrice}</span>
                </div>
                
                <div className="flex space-x-2 mt-3">
                  {order.status === "New" && (
                    <>
                      <Button 
                        size="sm" 
                        variant="outline" 
                        className="flex-1"
                        onClick={() => handleOrderStatusChange(order.id, "Rejected")}
                      >
                        Reject
                      </Button>
                      <Button 
                        size="sm" 
                        className="flex-1"
                        onClick={() => handleOrderStatusChange(order.id, "Preparing")}
                      >
                        Accept
                      </Button>
                    </>
                  )}
                  
                  {order.status === "Preparing" && (
                    <Button 
                      size="sm" 
                      className="flex-1"
                      onClick={() => handleOrderStatusChange(order.id, "Ready")}
                    >
                      Mark as Ready
                    </Button>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
          
          {incomingOrders.length === 0 && (
            <div className="text-center py-12">
              <p className="text-muted-foreground">No incoming orders</p>
            </div>
          )}
        </TabsContent>
        
        <TabsContent value="menu" className="flex-1 overflow-y-auto p-4">
          <div className="flex justify-between mb-4">
            <h3 className="font-semibold">Your Menu</h3>
            <Button size="sm" onClick={handleOpenAddDialog}>
              <Plus className="h-4 w-4 mr-1" />
              Add Item
            </Button>
          </div>
          
          {menuItems.length > 0 ? (
            <div className="space-y-4">
              {menuItems.map((item) => (
                <Card key={item.id}>
                  <CardContent className="p-3">
                    <div className="flex">
                      <div className="w-1/4 h-20 bg-muted rounded-md overflow-hidden">
                        <img
                          src={item.imageUrl}
                          alt={item.name}
                          className="h-full w-full object-cover"
                        />
                      </div>
                      <div className="w-3/4 pl-3 flex flex-col justify-between">
                        <div>
                          <div className="flex justify-between">
                            <h3 className="font-semibold">{item.name}</h3>
                            <span className="font-medium">${item.price.toFixed(2)}</span>
                          </div>
                          <p className="text-xs text-muted-foreground line-clamp-2">{item.description}</p>
                          <p className="text-xs text-skipit-primary mt-1">{item.category}</p>
                        </div>
                        
                        <div className="flex space-x-2 mt-2">
                          <Button 
                            size="sm" 
                            variant="outline" 
                            className="h-8 px-2"
                            onClick={() => handleOpenEditDialog(item)}
                          >
                            <Edit className="h-3 w-3 mr-1" />
                            Edit
                          </Button>
                          <Button 
                            size="sm" 
                            variant="outline" 
                            className="h-8 px-2 text-destructive hover:text-destructive"
                            onClick={() => handleDeleteMenuItem(item.id)}
                          >
                            <Trash className="h-3 w-3 mr-1" />
                            Delete
                          </Button>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : (
            <div className="text-center py-8 text-muted-foreground">
              <p className="mb-4">Your menu is empty</p>
              <Button size="sm" onClick={handleOpenAddDialog}>
                Add Your First Menu Item
              </Button>
            </div>
          )}
          
          {/* Add/Edit Menu Item Dialog */}
          <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>{isEditing ? "Edit Menu Item" : "Add Menu Item"}</DialogTitle>
                <DialogDescription>
                  {isEditing 
                    ? "Update the details of your menu item" 
                    : "Fill out the details to add a new item to your menu"}
                </DialogDescription>
              </DialogHeader>
              
              <div className="space-y-4 py-2">
                <div className="space-y-2">
                  <Label htmlFor="item-name">Item Name*</Label>
                  <Input
                    id="item-name"
                    value={newMenuItem.name}
                    onChange={(e) => setNewMenuItem({...newMenuItem, name: e.target.value})}
                    placeholder="e.g., Chicken Burrito"
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="item-category">Category*</Label>
                  <Input
                    id="item-category"
                    value={newMenuItem.category}
                    onChange={(e) => setNewMenuItem({...newMenuItem, category: e.target.value})}
                    placeholder="e.g., Burritos, Tacos, Sides"
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="item-price">Price*</Label>
                  <Input
                    id="item-price"
                    type="number"
                    value={newMenuItem.price}
                    onChange={(e) => setNewMenuItem({...newMenuItem, price: parseFloat(e.target.value) || 0})}
                    placeholder="9.99"
                    step="0.01"
                    min="0"
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="item-description">Description</Label>
                  <Textarea
                    id="item-description"
                    value={newMenuItem.description}
                    onChange={(e) => setNewMenuItem({...newMenuItem, description: e.target.value})}
                    placeholder="Brief description of the item"
                    rows={3}
                  />
                </div>
                
                <div className="space-y-2">
                  <Label>Item Image</Label>
                  <div className="border-2 border-dashed rounded-md p-4 text-center cursor-pointer hover:bg-gray-50" onClick={() => document.getElementById("menu-image-upload")?.click()}>
                    {imagePreview ? (
                      <div className="flex flex-col items-center">
                        <img src={imagePreview} alt="Preview" className="max-h-40 mb-2 rounded-md" />
                        <p className="text-sm text-muted-foreground">Click to change image</p>
                      </div>
                    ) : (
                      <div className="flex flex-col items-center">
                        <Upload className="h-10 w-10 text-muted-foreground mb-2" />
                        <p className="text-sm text-muted-foreground">Click to upload item image</p>
                      </div>
                    )}
                    <input 
                      id="menu-image-upload" 
                      type="file" 
                      accept="image/*" 
                      className="hidden" 
                      onChange={handleImageChange} 
                    />
                  </div>
                </div>
              </div>
              
              <DialogFooter>
                <Button variant="outline" onClick={() => setDialogOpen(false)}>
                  Cancel
                </Button>
                <Button onClick={handleSaveMenuItem}>
                  {isEditing ? "Update Item" : "Add Item"}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default RestaurantDashboard;
