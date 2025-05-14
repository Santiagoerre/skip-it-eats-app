
import { Home, Receipt, User } from "lucide-react";
import { NavLink } from "react-router-dom";

const BottomNav = () => {
  return (
    <div className="fixed bottom-0 left-0 right-0 h-16 bg-white border-t border-gray-200 flex items-center justify-around px-4">
      <NavLink
        to="/app"
        end
        className={({ isActive }) =>
          `flex flex-col items-center ${
            isActive ? "text-skipit-primary" : "text-gray-500"
          }`
        }
      >
        <Home className="h-6 w-6" />
        <span className="text-xs mt-1">Home</span>
      </NavLink>
      
      <NavLink
        to="/app/orders"
        className={({ isActive }) =>
          `flex flex-col items-center ${
            isActive ? "text-skipit-primary" : "text-gray-500"
          }`
        }
      >
        <Receipt className="h-6 w-6" />
        <span className="text-xs mt-1">Orders</span>
      </NavLink>
      
      <NavLink
        to="/app/account"
        className={({ isActive }) =>
          `flex flex-col items-center ${
            isActive ? "text-skipit-primary" : "text-gray-500"
          }`
        }
      >
        <User className="h-6 w-6" />
        <span className="text-xs mt-1">Account</span>
      </NavLink>
    </div>
  );
};

export default BottomNav;
