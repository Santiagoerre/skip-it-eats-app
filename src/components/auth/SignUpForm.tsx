
import { ReactNode } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";

interface SignUpFormProps {
  title: string;
  subtitle: string;
  onSubmit: (e: React.FormEvent) => Promise<void>;
  isLoading: boolean;
  children: ReactNode;
}

const SignUpForm = ({
  title,
  subtitle,
  onSubmit,
  isLoading,
  children
}: SignUpFormProps) => {
  const navigate = useNavigate();
  
  return (
    <div className="mobile-container app-height flex flex-col p-6 bg-white">
      <button 
        onClick={() => navigate("/signup")}
        className="flex items-center text-muted-foreground mb-6"
        disabled={isLoading}
      >
        <ArrowLeft className="mr-2 h-4 w-4" />
        Back
      </button>
      
      <div className="flex-1 flex flex-col">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-skipit-primary">{title}</h1>
          <p className="text-muted-foreground mt-2">{subtitle}</p>
        </div>
        
        <form onSubmit={onSubmit} className="space-y-6 pb-6">
          {children}
          
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

export default SignUpForm;
