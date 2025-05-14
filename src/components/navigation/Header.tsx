
import { Bell } from "lucide-react";
import { Link } from "react-router-dom";

const Header = () => {
  return (
    <header className="h-16 px-4 flex items-center justify-between border-b border-gray-200 bg-white">
      <Link to="/app" className="text-xl font-bold text-skipit-primary">
        Skip It
      </Link>
      
      <button className="p-2 relative">
        <Bell className="h-6 w-6 text-gray-700" />
        {/* Notification badge - can be conditionally rendered */}
        {/* <span className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full"></span> */}
      </button>
    </header>
  );
};

export default Header;
