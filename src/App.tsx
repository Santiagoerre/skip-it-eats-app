
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";

// Pages
import SplashScreen from "./pages/SplashScreen";
import SignIn from "./pages/SignIn";
import SignUp from "./pages/SignUp";
import ForgotPassword from "./pages/ForgotPassword";
import UserTypeSelection from "./pages/UserTypeSelection";
import MainLayout from "./layouts/MainLayout";
import MapListView from "./pages/MapListView";
import OrdersPage from "./pages/OrdersPage";
import AccountPage from "./pages/AccountPage";
import RestaurantDashboard from "./pages/RestaurantDashboard";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<SplashScreen />} />
          <Route path="/signin" element={<SignIn />} />
          <Route path="/signup" element={<SignUp />} />
          <Route path="/forgot-password" element={<ForgotPassword />} />
          <Route path="/user-type" element={<UserTypeSelection />} />
          <Route path="/restaurant-dashboard" element={<RestaurantDashboard />} />
          
          {/* Main app routes */}
          <Route path="/app" element={<MainLayout />}>
            <Route index element={<MapListView />} />
            <Route path="orders" element={<OrdersPage />} />
            <Route path="account" element={<AccountPage />} />
          </Route>
          
          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
