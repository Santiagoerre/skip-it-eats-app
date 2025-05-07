
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider } from "@/contexts/AuthContext";

// Pages
import SplashScreen from "./pages/SplashScreen";
import SignIn from "./pages/SignIn";
import UserTypeSelection from "./pages/UserTypeSelection";
import CustomerSignUp from "./pages/CustomerSignUp";
import RestaurantSignUp from "./pages/RestaurantSignUp";
import SignUpSuccess from "./pages/SignUpSuccess";
import ForgotPassword from "./pages/ForgotPassword";
import MainLayout from "./layouts/MainLayout";
import MapListView from "./pages/MapListView";
import RestaurantProfileView from "./pages/RestaurantProfileView";
import OrdersPage from "./pages/OrdersPage";
import AccountPage from "./pages/AccountPage";
import RestaurantDashboard from "./pages/RestaurantDashboard";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <AuthProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <Routes>
            <Route path="/" element={<SplashScreen />} />
            <Route path="/signin" element={<SignIn />} />
            <Route path="/signup" element={<UserTypeSelection />} />
            <Route path="/signup/customer" element={<CustomerSignUp />} />
            <Route path="/signup/restaurant" element={<RestaurantSignUp />} />
            <Route path="/signup-success" element={<SignUpSuccess />} />
            <Route path="/forgot-password" element={<ForgotPassword />} />
            <Route path="/restaurant-dashboard" element={<RestaurantDashboard />} />
            <Route path="/restaurant/:id" element={<RestaurantProfileView />} />
            
            {/* Main app routes */}
            <Route path="/app" element={<MainLayout />}>
              <Route index element={<MapListView />} />
              <Route path="orders" element={<OrdersPage />} />
              <Route path="account" element={<AccountPage />} />
            </Route>
            
            <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>
      </AuthProvider>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
