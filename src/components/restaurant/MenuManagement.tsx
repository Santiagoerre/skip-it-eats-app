
import { useState, useEffect } from "react";
import { useAuth } from "@/contexts/auth";
import { Plus, Edit, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/components/ui/use-toast";
import { MenuItem, fetchMenuItems, deleteMenuItem } from "@/services/restaurantService";
import MenuItemDialog from "./MenuItemDialog";

const MenuManagement = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [menuItems, setMenuItems] = useState<MenuItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [currentItem, setCurrentItem] = useState<MenuItem | null>(null);
  const [categories, setCategories] = useState<string[]>([]);

  useEffect(() => {
    if (user) {
      loadMenuItems();
    }
  }, [user]);

  const loadMenuItems = async () => {
    setIsLoading(true);
    try {
      if (!user?.id) {
        throw new Error("User ID is missing");
      }
      
      const items = await fetchMenuItems(user.id);
      setMenuItems(items);
      
      // Extract unique categories
      const uniqueCategories = [...new Set(items.map(item => item.category || 'Uncategorized'))];
      setCategories(uniqueCategories);
    } catch (error) {
      console.error("Error loading menu items:", error);
      toast({
        title: "Error loading menu",
        description: "Could not load your menu items. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleAddItem = () => {
    setCurrentItem(null);
    setIsDialogOpen(true);
  };

  const handleEditItem = (item: MenuItem) => {
    setCurrentItem(item);
    setIsDialogOpen(true);
  };

  const handleDeleteItem = async (itemId: string) => {
    try {
      await deleteMenuItem(itemId);
      toast({
        title: "Menu item deleted",
        description: "The menu item has been deleted successfully.",
      });
      loadMenuItems();
    } catch (error) {
      console.error("Error deleting menu item:", error);
      toast({
        title: "Error deleting item",
        description: "Could not delete the menu item. Please try again.",
        variant: "destructive",
      });
    }
  };

  const handleSaveItem = async () => {
    loadMenuItems();
    setIsDialogOpen(false);
  };

  if (isLoading) {
    return (
      <div className="p-4 text-center">
        <p>Loading menu items...</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h2 className="text-xl font-semibold">Menu Management</h2>
        <Button onClick={handleAddItem} className="flex items-center gap-1">
          <Plus className="h-4 w-4" /> Add Item
        </Button>
      </div>
      
      <Separator />
      
      {menuItems.length === 0 ? (
        <div className="text-center p-8 bg-muted rounded-lg">
          <p className="text-muted-foreground">Your menu is empty. Add your first item to get started!</p>
          <Button onClick={handleAddItem} className="mt-4">
            Add First Menu Item
          </Button>
        </div>
      ) : (
        <div className="space-y-6">
          {categories.map(category => (
            <div key={category} className="space-y-3">
              <h3 className="font-medium text-lg">{category}</h3>
              <div className="grid grid-cols-1 gap-3">
                {menuItems
                  .filter(item => (item.category || 'Uncategorized') === category)
                  .map(item => (
                    <Card key={item.id} className="overflow-hidden">
                      <CardContent className="p-0">
                        <div className="flex items-center p-4">
                          <div className="flex-1">
                            <div className="flex justify-between">
                              <div>
                                <h4 className="font-medium">{item.name}</h4>
                                {item.description && (
                                  <p className="text-muted-foreground text-sm line-clamp-2">{item.description}</p>
                                )}
                              </div>
                              <p className="font-semibold">${parseFloat(item.price.toString()).toFixed(2)}</p>
                            </div>
                          </div>
                          
                          <div className="flex space-x-1 ml-4">
                            <Button variant="ghost" size="icon" onClick={() => handleEditItem(item)}>
                              <Edit className="h-4 w-4" />
                            </Button>
                            <Button variant="ghost" size="icon" onClick={() => handleDeleteItem(item.id)}>
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
              </div>
            </div>
          ))}
        </div>
      )}
      
      <MenuItemDialog 
        open={isDialogOpen} 
        onOpenChange={setIsDialogOpen}
        item={currentItem}
        onSave={handleSaveItem}
      />
    </div>
  );
};

export default MenuManagement;
