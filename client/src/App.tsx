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
        <Route path={"/"} component={Home} />
        <Route path={"/login"} component={Login} />
        <Route path={"/register"} component={Register} />
        <Route path={"/documents"} component={Documents} />
        <Route path={"/projects"} component={Projects} />
        <Route path={"/materials"} component={Materials} />
        <Route path={"/forecasting"} component={ForecastingDashboard} />
        <Route path={"/purchase-orders"} component={PurchaseOrders} />
        <Route path={"/suppliers"} component={Suppliers} />
        <Route path={"/deliveries"} component={Deliveries} />
        <Route path={"/driver-deliveries"} component={DriverDeliveries} />
        <Route path={"/driver-app"} component={DriverApp} />
        <Route path={"/quality"} component={QualityControl} />
        <Route path={"/employees"} component={Employees} />
        <Route path={"/machines"} component={Machines} />
        <Route path={"/timesheets"} component={Timesheets} />
        <Route path={"/timesheet-summary"} component={TimesheetSummary} />
        <Route path={"/settings"} component={Settings} />
        <Route path={"/report-settings"} component={ReportSettings} />
        <Route path={"/email-branding"} component={EmailBrandingSettings} />
        <Route path={"/ai-assistant"} component={AIAssistant} />
        <Route path={"/dashboard-custom"} component={CustomizableDashboard} />
        <Route path={"/concrete-base"} component={ConcreteBaseDashboard} />
        <Route path={"/aggregate-inputs"} component={AggregateInputs} />
        <Route path={"/email-templates"} component={EmailTemplateEditor} />
        <Route path={"/notification-triggers"} component={NotificationTriggersAdmin} />
        <Route path={"/notification-templates"} component={NotificationTemplatesAdmin} />
        <Route path={"/design-system"} component={DesignSystem} />
        <Route path={"/change-password"} component={ChangePassword} />
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
