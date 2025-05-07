
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Switch } from "@/components/ui/switch";
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
import { 
  CreditCard, 
  Heart, 
  LogOut, 
  Settings, 
  User, 
  Bell, 
  HelpCircle, 
  BookUser,
  Gift,
  Lock
} from "lucide-react";
import { useToast } from "@/components/ui/use-toast";

const AccountPage = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [profileDialogOpen, setProfileDialogOpen] = useState(false);
  const [profileForm, setProfileForm] = useState({
    name: "John Doe",
    email: "john.doe@example.com",
    phone: "(555) 123-4567"
  });

  const handleSignOut = () => {
    // In a real app, we would sign out the user here
    navigate("/");
  };

  const handleSaveProfile = () => {
    // In a real app, we would update the user's profile here
    console.log("Saving profile:", profileForm);
    
    toast({
      description: "Profile updated successfully",
    });
    
    setProfileDialogOpen(false);
  };

  const handleAddPaymentMethod = () => {
    toast({
      description: "Payment method functionality would be implemented with Stripe integration",
    });
  };

  return (
    <div className="p-4">
      <div className="flex items-center space-x-4 mb-6">
        <Avatar className="h-16 w-16">
          <AvatarImage src="" />
          <AvatarFallback className="text-lg bg-skipit-primary text-white">JD</AvatarFallback>
        </Avatar>
        <div>
          <h1 className="text-xl font-bold">{profileForm.name}</h1>
          <p className="text-muted-foreground">{profileForm.email}</p>
        </div>
      </div>
      
      <div className="space-y-4">
        <Card>
          <CardContent className="p-0">
            <Dialog open={profileDialogOpen} onOpenChange={setProfileDialogOpen}>
              <DialogTrigger asChild>
                <Button variant="ghost" className="w-full justify-start p-3 h-auto rounded-none">
                  <User className="h-5 w-5 mr-3 text-muted-foreground" />
                  <span>Edit Profile</span>
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Edit Profile</DialogTitle>
                  <DialogDescription>
                    Update your personal information
                  </DialogDescription>
                </DialogHeader>
                
                <div className="space-y-4 py-2">
                  <div className="space-y-2">
                    <Label htmlFor="name">Full Name</Label>
                    <Input
                      id="name"
                      value={profileForm.name}
                      onChange={(e) => setProfileForm({...profileForm, name: e.target.value})}
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="email">Email</Label>
                    <Input
                      id="email"
                      type="email"
                      value={profileForm.email}
                      onChange={(e) => setProfileForm({...profileForm, email: e.target.value})}
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="phone">Phone Number</Label>
                    <Input
                      id="phone"
                      type="tel"
                      value={profileForm.phone}
                      onChange={(e) => setProfileForm({...profileForm, phone: e.target.value})}
                    />
                  </div>
                </div>
                
                <DialogFooter>
                  <Button variant="outline" onClick={() => setProfileDialogOpen(false)}>
                    Cancel
                  </Button>
                  <Button onClick={handleSaveProfile}>
                    Save Changes
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
            
            <Button variant="ghost" className="w-full justify-start p-3 h-auto rounded-none">
              <Heart className="h-5 w-5 mr-3 text-muted-foreground" />
              <span>Saved Restaurants</span>
            </Button>
            
            <Button variant="ghost" className="w-full justify-start p-3 h-auto rounded-none" onClick={handleAddPaymentMethod}>
              <CreditCard className="h-5 w-5 mr-3 text-muted-foreground" />
              <span>Payment Methods</span>
            </Button>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-0">
            <div className="p-3 border-b">
              <div className="flex items-center justify-between">
                <div className="flex items-center">
                  <Bell className="h-5 w-5 mr-3 text-muted-foreground" />
                  <span>Notifications</span>
                </div>
                <Switch />
              </div>
            </div>
            
            <div className="p-3 border-b">
              <div className="flex items-center justify-between">
                <div className="flex items-center">
                  <Lock className="h-5 w-5 mr-3 text-muted-foreground" />
                  <span>Password & Security</span>
                </div>
                <Button variant="ghost" size="sm" className="text-skipit-primary">
                  Change
                </Button>
              </div>
            </div>
            
            <Button variant="ghost" className="w-full justify-start p-3 h-auto rounded-none">
              <Settings className="h-5 w-5 mr-3 text-muted-foreground" />
              <span>Preferences</span>
            </Button>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-0">
            <Button variant="ghost" className="w-full justify-start p-3 h-auto rounded-none">
              <Gift className="h-5 w-5 mr-3 text-muted-foreground" />
              <span>Refer a Friend</span>
            </Button>
            
            <Button variant="ghost" className="w-full justify-start p-3 h-auto rounded-none">
              <HelpCircle className="h-5 w-5 mr-3 text-muted-foreground" />
              <span>Help & Support</span>
            </Button>
            
            <Button variant="ghost" className="w-full justify-start p-3 h-auto rounded-none">
              <BookUser className="h-5 w-5 mr-3 text-muted-foreground" />
              <span>About Skip It</span>
            </Button>
          </CardContent>
        </Card>
        
        <Button 
          variant="outline" 
          className="w-full justify-start p-3 h-auto text-destructive"
          onClick={handleSignOut}
        >
          <LogOut className="h-5 w-5 mr-3" />
          <span>Sign Out</span>
        </Button>
      </div>
    </div>
  );
};

export default AccountPage;
