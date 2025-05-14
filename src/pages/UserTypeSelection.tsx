import { useNavigate } from "react-router-dom";
import { useEffect } from "react";
import { useAuth } from "@/contexts/auth";
import RestaurantIcon from "@/components/icons/RestaurantIcon";
import CustomerIcon from "@/components/icons/CustomerIcon";

const UserTypeSelection = () => {
  const navigate = useNavigate();
  const { session, userType } = useAuth();

  // Redirect if already logged in with a user type
  useEffect(() => {
    if (session && userType) {
      if (userType === 'restaurant') {
        navigate("/restaurant-dashboard");
      } else if (userType === 'customer') {
        navigate("/app");
      }
    }
  }, [session, userType, navigate]);

  const handleRestaurantSelect = () => {
    // Set flag for new signup flow and navigate
    sessionStorage.setItem('is_new_signup', 'true');
    navigate("/signup/restaurant?new=true");
  };

  const handleCustomerSelect = () => {
    // Set flag for new signup flow and navigate
    sessionStorage.setItem('is_new_signup', 'true');
    navigate("/signup/customer?new=true");
  };

  return (
    <div className="mobile-container app-height flex flex-col items-center justify-center p-6 bg-white">
      <div className="text-center mb-12">
        <h1 className="text-3xl font-bold text-skipit-primary">Join Skip It</h1>
        <p className="text-muted-foreground mt-2">Choose how you want to use Skip It</p>
      </div>

      <div className="grid grid-cols-1 gap-6 w-full max-w-md">
        <button
          onClick={handleCustomerSelect}
          className="flex flex-col items-center justify-center p-6 border-2 border-muted rounded-lg hover:border-skipit-primary hover:bg-sky-50 transition-all"
        >
          <CustomerIcon className="w-20 h-20 mb-4 text-skipit-primary" />
          <h2 className="text-xl font-semibold">I'm a Customer</h2>
          <p className="text-muted-foreground text-sm mt-2">
            Sign up to order food from restaurants
          </p>
        </button>

        <button
          onClick={handleRestaurantSelect}
          className="flex flex-col items-center justify-center p-6 border-2 border-muted rounded-lg hover:border-skipit-primary hover:bg-sky-50 transition-all"
        >
          <RestaurantIcon className="w-20 h-20 mb-4 text-skipit-primary" />
          <h2 className="text-xl font-semibold">I'm a Restaurant</h2>
          <p className="text-muted-foreground text-sm mt-2">
            Sign up to receive orders from customers
          </p>
        </button>
      </div>

      <p className="text-sm text-center text-muted-foreground mt-8">
        Already have an account?{" "}
        <button
          className="text-skipit-primary font-medium hover:underline"
          onClick={() => navigate("/signin")}
        >
          Sign In
        </button>
      </p>
    </div>
  );
};

export default UserTypeSelection;
