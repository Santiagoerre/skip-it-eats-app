
import { useState, useEffect } from "react";
import { Plus, Edit, Trash2, ChevronsUp, ChevronsDown } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
  CardFooter,
} from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { useToast } from "@/components/ui/use-toast";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  MenuOptionGroup,
  MenuOption,
  fetchOptionGroupsWithOptions,
  createOptionGroup,
  updateOptionGroup,
  deleteOptionGroup,
  createOption,
  updateOption,
  deleteOption,
} from "@/services/menuOptionService";

interface MenuItemOptionsManagerProps {
  menuItemId: string;
  onOptionsUpdated?: () => void;
}

const MenuItemOptionsManager = ({ menuItemId, onOptionsUpdated }: MenuItemOptionsManagerProps) => {
  const { toast } = useToast();
  const [optionGroups, setOptionGroups] = useState<MenuOptionGroup[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedGroup, setSelectedGroup] = useState<MenuOptionGroup | null>(null);
  const [isGroupDialogOpen, setIsGroupDialogOpen] = useState(false);
  const [isOptionDialogOpen, setIsOptionDialogOpen] = useState(false);
  const [selectedOption, setSelectedOption] = useState<MenuOption | null>(null);

  // Form states for option group
  const [groupName, setGroupName] = useState("");
  const [groupDescription, setGroupDescription] = useState("");
  const [selectionType, setSelectionType] = useState<"single" | "multiple">("single");
  const [isRequired, setIsRequired] = useState(false);

  // Form states for option
  const [optionName, setOptionName] = useState("");
  const [optionDescription, setOptionDescription] = useState("");
  const [priceAdjustment, setPriceAdjustment] = useState("0.00");

  // Load option groups with their options
  useEffect(() => {
    if (menuItemId) {
      loadOptionGroups();
    }
  }, [menuItemId]);

  const loadOptionGroups = async () => {
    setIsLoading(true);
    try {
      const groups = await fetchOptionGroupsWithOptions(menuItemId);
      setOptionGroups(groups);
    } catch (error) {
      console.error("Error loading option groups:", error);
      toast({
        title: "Error",
        description: "Could not load option groups",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  // Handle adding a new option group
  const handleAddGroup = () => {
    setSelectedGroup(null);
    setGroupName("");
    setGroupDescription("");
    setSelectionType("single");
    setIsRequired(false);
    setIsGroupDialogOpen(true);
  };

  // Handle editing an option group
  const handleEditGroup = (group: MenuOptionGroup) => {
    setSelectedGroup(group);
    setGroupName(group.name);
    setGroupDescription(group.description || "");
    setSelectionType(group.selection_type);
    setIsRequired(group.required);
    setIsGroupDialogOpen(true);
  };

  // Handle deleting an option group
  const handleDeleteGroup = async (groupId: string) => {
    if (confirm("Are you sure you want to delete this option group? This will also delete all options in this group.")) {
      try {
        await deleteOptionGroup(groupId);
        toast({
          title: "Option group deleted",
          description: "The option group has been deleted successfully.",
        });
        loadOptionGroups();
        if (onOptionsUpdated) onOptionsUpdated();
      } catch (error) {
        console.error("Error deleting option group:", error);
        toast({
          title: "Error",
          description: "Could not delete the option group",
          variant: "destructive",
        });
      }
    }
  };

  // Handle saving an option group
  const handleSaveGroup = async () => {
    try {
      if (!groupName.trim()) {
        toast({
          title: "Error",
          description: "Group name is required",
          variant: "destructive",
        });
        return;
      }

      if (selectedGroup) {
        // Update existing group
        await updateOptionGroup(selectedGroup.id, {
          name: groupName,
          description: groupDescription || null,
          selection_type: selectionType,
          required: isRequired,
        });
        toast({
          title: "Option group updated",
          description: "The option group has been updated successfully.",
        });
      } else {
        // Create new group
        await createOptionGroup({
          menu_item_id: menuItemId,
          name: groupName,
          description: groupDescription || null,
          selection_type: selectionType,
          required: isRequired,
        });
        toast({
          title: "Option group added",
          description: "The option group has been added successfully.",
        });
      }
      
      setIsGroupDialogOpen(false);
      loadOptionGroups();
      if (onOptionsUpdated) onOptionsUpdated();
    } catch (error) {
      console.error("Error saving option group:", error);
      toast({
        title: "Error",
        description: "Could not save the option group",
        variant: "destructive",
      });
    }
  };

  // Handle adding a new option
  const handleAddOption = (group: MenuOptionGroup) => {
    setSelectedGroup(group);
    setSelectedOption(null);
    setOptionName("");
    setOptionDescription("");
    setPriceAdjustment("0.00");
    setIsOptionDialogOpen(true);
  };

  // Handle editing an option
  const handleEditOption = (group: MenuOptionGroup, option: MenuOption) => {
    setSelectedGroup(group);
    setSelectedOption(option);
    setOptionName(option.name);
    setOptionDescription(option.description || "");
    setPriceAdjustment(option.price_adjustment.toString());
    setIsOptionDialogOpen(true);
  };

  // Handle deleting an option
  const handleDeleteOption = async (optionId: string) => {
    if (confirm("Are you sure you want to delete this option?")) {
      try {
        await deleteOption(optionId);
        toast({
          title: "Option deleted",
          description: "The option has been deleted successfully.",
        });
        loadOptionGroups();
        if (onOptionsUpdated) onOptionsUpdated();
      } catch (error) {
        console.error("Error deleting option:", error);
        toast({
          title: "Error",
          description: "Could not delete the option",
          variant: "destructive",
        });
      }
    }
  };

  // Handle saving an option
  const handleSaveOption = async () => {
    try {
      if (!optionName.trim()) {
        toast({
          title: "Error",
          description: "Option name is required",
          variant: "destructive",
        });
        return;
      }

      if (!selectedGroup) return;

      const priceAdjustmentNumber = parseFloat(priceAdjustment);
      if (isNaN(priceAdjustmentNumber)) {
        toast({
          title: "Error",
          description: "Price adjustment must be a valid number",
          variant: "destructive",
        });
        return;
      }

      if (selectedOption) {
        // Update existing option
        await updateOption(selectedOption.id, {
          name: optionName,
          description: optionDescription || null,
          price_adjustment: priceAdjustmentNumber,
        });
        toast({
          title: "Option updated",
          description: "The option has been updated successfully.",
        });
      } else {
        // Create new option
        await createOption({
          option_group_id: selectedGroup.id,
          name: optionName,
          description: optionDescription || null,
          price_adjustment: priceAdjustmentNumber,
        });
        toast({
          title: "Option added",
          description: "The option has been added successfully.",
        });
      }
      
      setIsOptionDialogOpen(false);
      loadOptionGroups();
      if (onOptionsUpdated) onOptionsUpdated();
    } catch (error) {
      console.error("Error saving option:", error);
      toast({
        title: "Error",
        description: "Could not save the option",
        variant: "destructive",
      });
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-medium">Item Options</h3>
        <Button onClick={handleAddGroup} className="flex items-center gap-1" size="sm">
          <Plus className="h-4 w-4" /> Add Option Group
        </Button>
      </div>

      {isLoading ? (
        <div className="text-center p-4">
          <p>Loading options...</p>
        </div>
      ) : optionGroups.length === 0 ? (
        <div className="text-center p-4 bg-muted rounded-lg">
          <p className="text-muted-foreground">No option groups added yet.</p>
          <p className="text-muted-foreground text-sm">
            Add option groups like "Choose toppings" or "Select a side" to let customers customize their order.
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {optionGroups.map((group) => (
            <Card key={group.id}>
              <CardHeader className="pb-2">
                <div className="flex justify-between items-center">
                  <div>
                    <CardTitle className="text-base">{group.name}</CardTitle>
                    <CardDescription>
                      {group.selection_type === "single" ? "Select one option" : "Select multiple options"}
                      {group.required ? " (Required)" : " (Optional)"}
                    </CardDescription>
                  </div>
                  <div className="flex space-x-1">
                    <Button variant="ghost" size="icon" onClick={() => handleEditGroup(group)}>
                      <Edit className="h-4 w-4" />
                    </Button>
                    <Button variant="ghost" size="icon" onClick={() => handleDeleteGroup(group.id)}>
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                {group.options && group.options.length > 0 ? (
                  <div className="space-y-2">
                    {group.options.map((option) => (
                      <div
                        key={option.id}
                        className="flex justify-between items-center p-2 rounded bg-muted"
                      >
                        <div>
                          <p className="font-medium">{option.name}</p>
                          {option.price_adjustment > 0 && (
                            <p className="text-sm text-muted-foreground">
                              +${option.price_adjustment.toFixed(2)}
                            </p>
                          )}
                        </div>
                        <div className="flex space-x-1">
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleEditOption(group, option)}
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleDeleteOption(option.id)}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-sm text-muted-foreground py-2">No options added yet.</p>
                )}
              </CardContent>
              <CardFooter className="pt-0">
                <Button
                  variant="outline"
                  size="sm"
                  className="w-full flex items-center justify-center gap-1"
                  onClick={() => handleAddOption(group)}
                >
                  <Plus className="h-4 w-4" /> Add Option
                </Button>
              </CardFooter>
            </Card>
          ))}
        </div>
      )}

      {/* Option Group Dialog */}
      <Dialog open={isGroupDialogOpen} onOpenChange={setIsGroupDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {selectedGroup ? "Edit Option Group" : "Add Option Group"}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="group-name">Group Name</Label>
              <Input
                id="group-name"
                placeholder="e.g., Choose toppings"
                value={groupName}
                onChange={(e) => setGroupName(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="group-description">Description (Optional)</Label>
              <Textarea
                id="group-description"
                placeholder="e.g., Select your favorite toppings"
                value={groupDescription}
                onChange={(e) => setGroupDescription(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="selection-type">Selection Type</Label>
              <Select
                value={selectionType}
                onValueChange={(value) => setSelectionType(value as "single" | "multiple")}
              >
                <SelectTrigger id="selection-type">
                  <SelectValue placeholder="Select a type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="single">Single Choice (Radio)</SelectItem>
                  <SelectItem value="multiple">Multiple Choice (Checkbox)</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="flex items-center space-x-2">
              <Switch
                id="required"
                checked={isRequired}
                onCheckedChange={setIsRequired}
              />
              <Label htmlFor="required">Required</Label>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsGroupDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleSaveGroup}>
              {selectedGroup ? "Update Group" : "Add Group"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Option Dialog */}
      <Dialog open={isOptionDialogOpen} onOpenChange={setIsOptionDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {selectedOption ? "Edit Option" : "Add Option"}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="option-name">Option Name</Label>
              <Input
                id="option-name"
                placeholder="e.g., Extra Cheese"
                value={optionName}
                onChange={(e) => setOptionName(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="option-description">Description (Optional)</Label>
              <Textarea
                id="option-description"
                placeholder="e.g., Delicious mozzarella cheese"
                value={optionDescription}
                onChange={(e) => setOptionDescription(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="price-adjustment">Price Adjustment ($)</Label>
              <Input
                id="price-adjustment"
                type="number"
                step="0.01"
                placeholder="0.00"
                value={priceAdjustment}
                onChange={(e) => setPriceAdjustment(e.target.value)}
              />
              <p className="text-sm text-muted-foreground">
                Enter the additional cost for this option. Use 0 for no extra charge.
              </p>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsOptionDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleSaveOption}>
              {selectedOption ? "Update Option" : "Add Option"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default MenuItemOptionsManager;
