
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { CreditCard, Heart, LogOut, Settings, User } from "lucide-react";

const AccountPage = () => {
  const navigate = useNavigate();

  const handleSignOut = () => {
    // In a real app, we would sign out the user here
    navigate("/");
  };

  return (
    <div className="p-4">
      <div className="flex items-center space-x-4 mb-6">
        <Avatar className="h-16 w-16">
          <AvatarImage src="" />
          <AvatarFallback className="text-lg bg-skipit-primary text-white">JD</AvatarFallback>
        </Avatar>
        <div>
          <h1 className="text-xl font-bold">John Doe</h1>
          <p className="text-muted-foreground">john.doe@example.com</p>
        </div>
      </div>
      
      <div className="space-y-4">
        <Card>
          <CardContent className="p-0">
            <Button variant="ghost" className="w-full justify-start p-3 h-auto rounded-none">
              <User className="h-5 w-5 mr-3 text-muted-foreground" />
              <span>Edit Profile</span>
            </Button>
            
            <Button variant="ghost" className="w-full justify-start p-3 h-auto rounded-none">
              <Heart className="h-5 w-5 mr-3 text-muted-foreground" />
              <span>Saved Restaurants</span>
            </Button>
            
            <Button variant="ghost" className="w-full justify-start p-3 h-auto rounded-none">
              <CreditCard className="h-5 w-5 mr-3 text-muted-foreground" />
              <span>Payment Methods</span>
            </Button>
            
            <Button variant="ghost" className="w-full justify-start p-3 h-auto rounded-none">
              <Settings className="h-5 w-5 mr-3 text-muted-foreground" />
              <span>Settings</span>
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
