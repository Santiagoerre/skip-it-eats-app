
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ArrowLeft } from "lucide-react";
import { useToast } from "@/components/ui/use-toast";

const ForgotPassword = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [email, setEmail] = useState("");
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError("");

    try {
      // This is where we would request password reset with Supabase
      // const { data, error } = await supabase.auth.resetPasswordForEmail(email, {
      //   redirectTo: `${window.location.origin}/reset-password`,
      // });
      
      // If error, show error message
      // if (error) throw error;
      
      // For now, we'll simulate successful password reset request
      console.log("Password reset for:", email);
      
      toast({
        title: "Reset email sent",
        description: "If an account exists with this email, you'll receive reset instructions."
      });
      
      setIsSubmitted(true);
    } catch (err: any) {
      setError(err.message || "Failed to send reset email");
      toast({
        title: "Error",
        description: err.message || "Failed to send reset email. Please try again.",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="mobile-container app-height flex flex-col p-6">
      <button 
        onClick={() => navigate("/signin")}
        className="flex items-center text-muted-foreground mb-6"
        disabled={isLoading}
      >
        <ArrowLeft className="mr-2 h-4 w-4" />
        Back to Sign In
      </button>
      
      <div className="flex-1 flex flex-col justify-center">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-skipit-primary">Forgot Password?</h1>
          <p className="text-muted-foreground mt-2">
            Enter your email to receive a password reset link
          </p>
        </div>
        
        {error && (
          <div className="bg-red-50 text-red-700 p-4 mb-6 rounded-md">
            {error}
          </div>
        )}
        
        {!isSubmitted ? (
          <form onSubmit={handleSubmit} className="space-y-6">
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
            
            <Button 
              type="submit" 
              className="w-full py-6 text-base"
              disabled={isLoading}
            >
              {isLoading ? "Sending..." : "Recover Password"}
            </Button>
          </form>
        ) : (
          <div className="text-center space-y-6">
            <div className="bg-green-50 text-green-700 p-4 rounded-md">
              If an account exists for {email}, we've sent password reset instructions.
            </div>
            <Button
              onClick={() => navigate("/signin")}
              className="mt-6"
            >
              Return to Sign In
            </Button>
          </div>
        )}
      </div>
    </div>
  );
};

export default ForgotPassword;
