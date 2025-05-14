import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider } from "@/contexts/auth";
import ProtectedRoute from "@/components/ProtectedRoute";
import { useState } from "react";

// Pages
import SplashScreen from "./pages/SplashScreen";
import SignIn from "./pages/SignIn";
import SignUp from "./pages/SignUp";
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

const App = () => {
  // Use useState to ensure QueryClient follows React hooks rules
  const [queryClient] = useState(() => new QueryClient({
    defaultOptions: {
      queries: {
        retry: 1,
        refetchOnWindowFocus: false,
      },
    },
  }));

  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <AuthProvider>
          <Toaster />
          <Sonner />
          <BrowserRouter>
            <Routes>
              {/* Public routes */}
              <Route path="/" element={<SplashScreen />} />
              <Route path="/signin" element={<SignIn />} />
              <Route path="/signup" element={<UserTypeSelection />} />
              <Route path="/signup/customer" element={<CustomerSignUp />} />
              <Route path="/signup/restaurant" element={<RestaurantSignUp />} />
              <Route path="/signup-success" element={<SignUpSuccess />} />
              <Route path="/forgot-password" element={<ForgotPassword />} />
              <Route path="/auth/callback" element={<SignUpSuccess />} />
              
              {/* Restaurant routes */}
              <Route path="/restaurant-dashboard" element={
                <ProtectedRoute requiredUserType="restaurant">
                  <RestaurantDashboard />
                </ProtectedRoute>
              } />
              
              {/* Customer routes */}
              <Route path="/app" element={
                <ProtectedRoute requiredUserType="customer">
                  <MainLayout />
                </ProtectedRoute>
              }>
                <Route index element={<MapListView />} />
                <Route path="orders" element={<OrdersPage />} />
                <Route path="account" element={<AccountPage />} />
              </Route>
              
              {/* Shared routes */}
              <Route path="/restaurant/:id" element={
                <ProtectedRoute>
                  <RestaurantProfileView />
                </ProtectedRoute>
              } />
              
              <Route path="*" element={<NotFound />} />
            </Routes>
          </BrowserRouter>
        </AuthProvider>
      </TooltipProvider>
    </QueryClientProvider>
  );
};

export default App;
