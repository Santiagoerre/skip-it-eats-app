
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ArrowLeft } from "lucide-react";
import { useToast } from "@/components/ui/use-toast";

const SignUp = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (password !== confirmPassword) {
      setError("Passwords don't match");
      return;
    }

    setIsLoading(true);
    setError("");

    try {
      // This is where we would register with Supabase
      // const { data, error } = await supabase.auth.signUp({ email, password });
      
      // If error, show error message
      // if (error) throw error;
      
      // For now, we'll simulate successful registration
      console.log("Signing up with:", email, password);
      
      toast({
        title: "Account created!",
        description: "Your account has been created successfully.",
      });
      
      navigate("/user-type");
    } catch (err: any) {
      setError(err.message || "Failed to sign up");
      toast({
        title: "Error signing up",
        description: err.message || "Please check your information and try again",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="mobile-container app-height flex flex-col p-6">
      <button 
        onClick={() => navigate("/")}
        className="flex items-center text-muted-foreground mb-6"
      >
        <ArrowLeft className="mr-2 h-4 w-4" />
        Back
      </button>
      
      <div className="flex-1 flex flex-col justify-center">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-skipit-primary">Create Account</h1>
          <p className="text-muted-foreground mt-2">Sign up to get started</p>
        </div>
        
        {error && (
          <div className="bg-red-50 text-red-700 p-4 mb-6 rounded-md">
            {error}
          </div>
        )}
        
        <form onSubmit={handleSignUp} className="space-y-6">
          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              type="email"
              placeholder="your@email.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              disabled={isLoading}
            />
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="password">Password</Label>
            <Input
              id="password"
              type="password"
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              disabled={isLoading}
            />
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="confirmPassword">Confirm Password</Label>
            <Input
              id="confirmPassword"
              type="password"
              placeholder="••••••••"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              required
              disabled={isLoading}
            />
          </div>
          
          <Button 
            type="submit" 
            className="w-full py-6 text-base"
            disabled={isLoading}
          >
            {isLoading ? "Signing Up..." : "Sign Up"}
          </Button>
          
          <div className="text-center mt-6">
            <p className="text-sm text-muted-foreground">
              Already have an account?{" "}
              <Button
                variant="link"
                className="p-0 h-auto"
                onClick={() => navigate("/signin")}
                disabled={isLoading}
              >
                Sign In
              </Button>
            </p>
          </div>
        </form>
      </div>
    </div>
  );
};

export default SignUp;
