import React from "react";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { Toaster } from "@/components/ui/toaster";
import { AuthProvider } from "@/components/auth/AuthProvider";
import { ThemeProvider } from "@/components/theme/ThemeProvider";
import { Footer } from "@/components/layout/Footer";
import Index from "./pages/Index";
import NotFound from "./pages/NotFound";
import { PostLost } from "./pages/PostLost";
import { PostFound } from "./pages/PostFound";
import { Search } from "./pages/Search";
import { Community } from "./pages/Community";
import ItemDetail from "./pages/ItemDetail";
import { Profile } from "./pages/Profile";
import { Privacy } from "./pages/Privacy";
import { Messages } from "./pages/Messages";
import { Admin } from "./pages/Admin";
import { EditItem } from "./pages/EditItem";
import { MyOffers } from "./pages/MyOffers";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <ThemeProvider>
      <AuthProvider>
        <TooltipProvider>
          <Toaster />
          <Sonner />
          <BrowserRouter>
            <Routes>
              <Route path="/" element={<Index />} />
              <Route path="/post-lost" element={<PostLost />} />
              <Route path="/post-found" element={<PostFound />} />
              <Route path="/search" element={<Search />} />
              <Route path="/community" element={<Community />} />
              <Route path="/item/:id" element={<ItemDetail />} />
              <Route path="/profile" element={<Profile />} />
              <Route path="/privacy" element={<Privacy />} />
              <Route path="/messages" element={<Messages />} />
              <Route path="/admin" element={<Admin />} />
              <Route path="/edit-item/:id" element={<EditItem />} />
              <Route path="/my-offers" element={<MyOffers />} />
              <Route path="*" element={<NotFound />} />
            </Routes>
            <Footer />
          </BrowserRouter>
        </TooltipProvider>
      </AuthProvider>
    </ThemeProvider>
  </QueryClientProvider>
);

export default App;