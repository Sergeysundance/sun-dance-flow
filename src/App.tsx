import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Route, Routes } from "react-router-dom";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import Index from "./pages/Index.tsx";
import NotFound from "./pages/NotFound.tsx";
import AdminLayout from "./layouts/AdminLayout.tsx";
import DashboardPage from "./pages/admin/DashboardPage.tsx";
import ClientsPage from "./pages/admin/ClientsPage.tsx";
import ClientDetailPage from "./pages/admin/ClientDetailPage.tsx";
import TeachersPage from "./pages/admin/TeachersPage.tsx";
import SchedulePage from "./pages/admin/SchedulePage.tsx";
import SubscriptionTypesPage from "./pages/admin/SubscriptionTypesPage.tsx";
import SubscriptionsPage from "./pages/admin/SubscriptionsPage.tsx";
import RoomsPage from "./pages/admin/RoomsPage.tsx";
import DirectionsPage from "./pages/admin/DirectionsPage.tsx";
import TrialRequestsPage from "./pages/admin/TrialRequestsPage.tsx";
import CheckInPage from "./pages/admin/CheckInPage.tsx";
import FaqPage from "./pages/admin/FaqPage.tsx";
import BranchesPage from "./pages/admin/BranchesPage.tsx";
import SettingsPage from "./pages/admin/SettingsPage.tsx";
import StudentDashboard from "./pages/StudentDashboard.tsx";
import TeacherDashboard from "./pages/TeacherDashboard.tsx";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Index />} />
          <Route path="/dashboard" element={<StudentDashboard />} />
          <Route path="/teacher-dashboard" element={<TeacherDashboard />} />
          <Route path="/admin" element={<AdminLayout />}>
            <Route index element={<DashboardPage />} />
            <Route path="clients" element={<ClientsPage />} />
            <Route path="clients/:id" element={<ClientDetailPage />} />
            <Route path="teachers" element={<TeachersPage />} />
            <Route path="schedule" element={<SchedulePage />} />
            <Route path="subscription-types" element={<SubscriptionTypesPage />} />
            <Route path="subscriptions" element={<SubscriptionsPage />} />
            <Route path="rooms" element={<RoomsPage />} />
            <Route path="directions" element={<DirectionsPage />} />
            <Route path="trial-requests" element={<TrialRequestsPage />} />
            <Route path="check-in" element={<CheckInPage />} />
            <Route path="faq" element={<FaqPage />} />
            <Route path="settings" element={<SettingsPage />} />
          </Route>
          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
