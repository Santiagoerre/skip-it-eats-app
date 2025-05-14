
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useToast } from "@/components/ui/use-toast";
import { useAuth } from "@/contexts/auth";
import SignUpForm from "@/components/auth/SignUpForm";
import EmailPasswordFields from "@/components/auth/EmailPasswordFields";
import GoogleSignUpButton from "@/components/auth/GoogleSignUpButton";
import { useFormValidation } from "@/hooks/useFormValidation";

const CustomerSignUp = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { signUp } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const { errors, validateEmailAndPassword } = useFormValidation();

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateEmailAndPassword(email, password, confirmPassword)) {
      return;
    }

    setIsLoading(true);
    
    try {
      await signUp(email, password, "customer");
      
      toast({
        title: "Account created!",
        description: "Your customer account has been created successfully.",
      });
      
      navigate("/signup-success");
    } catch (error) {
      // Error is handled in the signUp function
      console.error(error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <SignUpForm
      title="Create Customer Account"
      subtitle="Sign up to start ordering food"
      onSubmit={handleSignUp}
      isLoading={isLoading}
    >
      <EmailPasswordFields
        email={email}
        setEmail={setEmail}
        password={password}
        setPassword={setPassword}
        confirmPassword={confirmPassword}
        setConfirmPassword={setConfirmPassword}
        errors={errors}
        isLoading={isLoading}
      />
      
      <GoogleSignUpButton 
        userType="customer"
        isLoading={isLoading}
        setIsLoading={setIsLoading}
      />
    </SignUpForm>
  );
};

export default CustomerSignUp;
