import { lazy, Suspense, useEffect } from "react";
import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import NotFound from "@/pages/NotFound";
import { Route, Switch } from "wouter";
import ErrorBoundary from "./components/ErrorBoundary";
import { ThemeProvider } from "./contexts/ThemeContext";
import Home from "./pages/Home";
import Login from "./pages/Login";
import Register from "./pages/Register";
import { ProtectedRoute } from "./components/ProtectedRoute";
import { AdminRoute } from "./components/AdminRoute";
// Lazy loaded feature routes
const Documents = lazy(() => import("./pages/Documents"));
const Projects = lazy(() => import("./pages/Projects"));
const Materials = lazy(() => import("./pages/Materials"));
const Deliveries = lazy(() => import("./pages/Deliveries"));
const QualityControl = lazy(() => import("./pages/QualityControl"));
const Employees = lazy(() => import("./pages/Employees"));
const Machines = lazy(() => import("./pages/Machines"));
const Timesheets = lazy(() => import("./pages/Timesheets"));
const TimesheetSummary = lazy(() => import("./pages/TimesheetSummary"));
const Settings = lazy(() => import("./pages/Settings"));
const DriverDeliveries = lazy(() => import("./pages/DriverDeliveries"));
const ForecastingDashboard = lazy(() => import("./pages/ForecastingDashboard"));
const PurchaseOrders = lazy(() => import("./pages/PurchaseOrders"));
const ReportSettings = lazy(() => import("./pages/ReportSettings"));
const EmailBrandingSettings = lazy(() => import("./pages/EmailBrandingSettings"));
const AIAssistant = lazy(() => import("./pages/AIAssistant"));
const CustomizableDashboard = lazy(() => import("./pages/CustomizableDashboard"));
const ConcreteBaseDashboard = lazy(() => import("./pages/ConcreteBaseDashboard"));
const AggregateInputs = lazy(() => import("./pages/AggregateInputs"));
const EmailTemplateEditor = lazy(() => import("./pages/EmailTemplateEditor"));
const NotificationTriggersAdmin = lazy(() => import("./pages/NotificationTriggersAdmin"));
const NotificationTemplatesAdmin = lazy(() => import("./pages/NotificationTemplatesAdmin"));
const DriverApp = lazy(() => import("./pages/DriverApp"));
const Suppliers = lazy(() => import("./pages/Suppliers"));
const DesignSystem = lazy(() => import("./pages/DesignSystem"));
const ChangePassword = lazy(() => import("./pages/ChangePassword"));

const Fallback = () => (
  <div className="min-h-screen flex items-center justify-center bg-background">
    <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
  </div>
);

function Router() {
  return (
    <Suspense fallback={<Fallback />}>
      <Switch>
        <Route path={"/login"} component={Login} />
        <Route path={"/register"} component={Register} />
        <Route path={"/driver-app"} component={DriverApp} />

        <Route path={"/"} component={() => <ProtectedRoute><Home /></ProtectedRoute>} />
        <Route path={"/documents"} component={() => <ProtectedRoute><Documents /></ProtectedRoute>} />
        <Route path={"/projects"} component={() => <ProtectedRoute><Projects /></ProtectedRoute>} />
        <Route path={"/materials"} component={() => <ProtectedRoute><Materials /></ProtectedRoute>} />
        <Route path={"/forecasting"} component={() => <ProtectedRoute><ForecastingDashboard /></ProtectedRoute>} />
        <Route path={"/purchase-orders"} component={() => <ProtectedRoute><PurchaseOrders /></ProtectedRoute>} />
        <Route path={"/suppliers"} component={() => <ProtectedRoute><Suppliers /></ProtectedRoute>} />
        <Route path={"/deliveries"} component={() => <ProtectedRoute><Deliveries /></ProtectedRoute>} />
        <Route path={"/driver-deliveries"} component={() => <ProtectedRoute><DriverDeliveries /></ProtectedRoute>} />
        <Route path={"/quality"} component={() => <ProtectedRoute><QualityControl /></ProtectedRoute>} />
        <Route path={"/employees"} component={() => <ProtectedRoute><Employees /></ProtectedRoute>} />
        <Route path={"/machines"} component={() => <ProtectedRoute><Machines /></ProtectedRoute>} />
        <Route path={"/timesheets"} component={() => <ProtectedRoute><Timesheets /></ProtectedRoute>} />
        <Route path={"/timesheet-summary"} component={() => <ProtectedRoute><TimesheetSummary /></ProtectedRoute>} />
        <Route path={"/ai-assistant"} component={() => <ProtectedRoute><AIAssistant /></ProtectedRoute>} />
        <Route path={"/dashboard-custom"} component={() => <ProtectedRoute><CustomizableDashboard /></ProtectedRoute>} />
        <Route path={"/concrete-base"} component={() => <ProtectedRoute><ConcreteBaseDashboard /></ProtectedRoute>} />
        <Route path={"/aggregate-inputs"} component={() => <ProtectedRoute><AggregateInputs /></ProtectedRoute>} />
        <Route path={"/design-system"} component={() => <ProtectedRoute><DesignSystem /></ProtectedRoute>} />
        <Route path={"/change-password"} component={() => <ProtectedRoute><ChangePassword /></ProtectedRoute>} />

        <Route path={"/settings"} component={() => <AdminRoute><Settings /></AdminRoute>} />
        <Route path={"/report-settings"} component={() => <AdminRoute><ReportSettings /></AdminRoute>} />
        <Route path={"/email-branding"} component={() => <AdminRoute><EmailBrandingSettings /></AdminRoute>} />
        <Route path={"/email-templates"} component={() => <AdminRoute><EmailTemplateEditor /></AdminRoute>} />
        <Route path={"/notification-triggers"} component={() => <AdminRoute><NotificationTriggersAdmin /></AdminRoute>} />
        <Route path={"/notification-templates"} component={() => <AdminRoute><NotificationTemplatesAdmin /></AdminRoute>} />

        <Route path={"/404"} component={NotFound} />
        <Route component={NotFound} />
      </Switch>
    </Suspense>
  );
}

function App() {
  useEffect(() => {
    if (typeof window !== 'undefined' && 'serviceWorker' in navigator) {
      const registerSW = () => {
        navigator.serviceWorker.register('/sw.js').catch(error => {
          console.error('Service Worker registration failed:', error);
        });
      };

      if (document.readyState === 'complete') {
        registerSW();
      } else {
        window.addEventListener('load', registerSW);
        return () => window.removeEventListener('load', registerSW);
      }
    }
  }, []);

  return (
    <ErrorBoundary>
      <ThemeProvider defaultTheme="dark">
        <TooltipProvider>
          <Toaster />
          <Router />
        </TooltipProvider>
      </ThemeProvider>
    </ErrorBoundary>
  );
}

export default App;
