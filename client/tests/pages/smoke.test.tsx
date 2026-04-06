/**
 * Smoke tests: each page component renders without crashing.
 *
 * Heavy dependencies (tRPC, Auth0, router, complex sub-components) are mocked
 * so pages can mount in isolation with no network / DB.
 */
import React, { Suspense } from "react";
import { render, screen } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { makeTrpcMock } from "../__mocks__/trpc.mock";

// ── Global mocks ─────────────────────────────────────────────────────────────

vi.mock("@/lib/trpc", () => ({ trpc: makeTrpcMock() }));

vi.mock("@auth0/auth0-react", () => ({
  useAuth0: vi.fn(() => ({
    loginWithRedirect: vi.fn(),
    logout: vi.fn(),
    isAuthenticated: true,
    isLoading: false,
    user: { sub: "auth0|test", name: "Test User" },
    getAccessTokenSilently: vi.fn().mockResolvedValue("token"),
  })),
  Auth0Provider: ({ children }: { children: React.ReactNode }) => <>{children}</>,
}));

vi.mock("@/hooks/useAuth", () => ({
  useAuth: vi.fn(() => ({
    user: { id: 1, username: "testuser", role: "admin" },
    loading: false,
    isAuthenticated: true,
    error: null,
    logout: vi.fn(),
    refresh: vi.fn(),
  })),
}));

vi.mock("wouter", () => ({
  useLocation: vi.fn(() => ["/", vi.fn()]),
  useRoute: vi.fn(() => [false, {}]),
  Redirect: ({ to }: { to: string }) => <div data-testid="redirect">{to}</div>,
  Link: ({ children, href }: { children: React.ReactNode; href: string }) => (
    <a href={href}>{children}</a>
  ),
  Route: ({ children }: { children: React.ReactNode }) => <>{children}</>,
  Switch: ({ children }: { children: React.ReactNode }) => <>{children}</>,
}));

vi.mock("sonner", () => ({
  toast: { success: vi.fn(), error: vi.fn(), info: vi.fn(), warning: vi.fn() },
  Toaster: () => null,
}));

// Mock DashboardLayout to avoid pulling in full nav/auth tree
vi.mock("@/components/DashboardLayout", () => ({
  default: ({ children }: { children: React.ReactNode }) => (
    <div data-testid="dashboard-layout">{children}</div>
  ),
}));

// Mock heavy feature sub-components
const Noop = ({ testId }: { testId: string }) => <div data-testid={testId} />;

vi.mock("@/components/LiveDeliveryMap", () => ({
  LiveDeliveryMap: () => <Noop testId="mock-live-delivery-map" />,
}));
vi.mock("@/components/DeliveryAnalyticsDashboard", () => ({
  DeliveryAnalyticsDashboard: () => <Noop testId="mock-delivery-analytics" />,
}));
vi.mock("@/components/DeliveryNote", () => ({
  DeliveryNote: () => <Noop testId="mock-delivery-note" />,
}));
vi.mock("@/components/MobileQCForm", () => ({
  MobileQCForm: () => <Noop testId="mock-mobile-qc-form" />,
}));
vi.mock("@/components/QCTrendsDashboard", () => ({
  QCTrendsDashboard: () => <Noop testId="mock-qc-trends" />,
}));
vi.mock("@/components/PredictiveQcPanel", () => ({
  PredictiveQcPanel: () => <Noop testId="mock-predictive-qc" />,
}));
vi.mock("@/components/ComplianceCertificate", () => ({
  ComplianceCertificate: () => <Noop testId="mock-compliance" />,
}));
vi.mock("@/components/EquipmentHealthFusion", () => ({
  EquipmentHealthFusion: () => <Noop testId="mock-equipment-health" />,
}));
vi.mock("@/components/InventoryAnalytics", () => ({
  InventoryAnalytics: () => <Noop testId="mock-inventory-analytics" />,
}));
vi.mock("@/components/MaterialBundlingSuggestions", () => ({
  MaterialBundlingSuggestions: () => <Noop testId="mock-bundling" />,
}));
vi.mock("@/components/MaterialConsumptionChart", () => ({
  MaterialConsumptionChart: () => <Noop testId="mock-material-chart" />,
}));
vi.mock("@/components/DeliveryTrendsChart", () => ({
  default: () => <Noop testId="mock-delivery-trends" />,
  DeliveryTrendsChart: () => <Noop testId="mock-delivery-trends" />,
}));
vi.mock("@/components/DeliveryTimeline", () => ({
  DeliveryTimeline: () => <Noop testId="mock-delivery-timeline" />,
}));
vi.mock("@/components/SupplierScorecard", () => ({
  SupplierScorecard: () => <Noop testId="mock-supplier-scorecard" />,
}));
vi.mock("@/components/DashboardCustomizer", () => ({
  DashboardCustomizer: () => <Noop testId="mock-dashboard-customizer" />,
}));
vi.mock("@/components/DashboardFilters", () => ({
  DashboardFilters: () => <Noop testId="mock-dashboard-filters" />,
}));
vi.mock("@/components/DashboardLayoutSkeleton", () => ({
  default: () => <Noop testId="mock-dashboard-skeleton" />,
}));
vi.mock("@/components/PrintableTimesheetReport", () => ({
  PrintableTimesheetReport: () => <Noop testId="mock-timesheet-report" />,
}));
vi.mock("@/components/TimesheetUploadModal", () => ({
  TimesheetUploadModal: () => <Noop testId="mock-timesheet-upload" />,
}));
vi.mock("@/components/UploadHistoryDrawer", () => ({
  UploadHistoryDrawer: () => <Noop testId="mock-upload-history" />,
}));
vi.mock("@/components/AIChatBox", () => ({
  AIChatBox: () => <Noop testId="mock-ai-chatbox" />,
}));
vi.mock("@/components/PromptTemplates", () => ({
  PromptTemplates: () => <Noop testId="mock-prompt-templates" />,
}));
vi.mock("@/components/VoiceActivationFAB", () => ({
  VoiceActivationFAB: () => <Noop testId="mock-voice-fab" />,
}));
vi.mock("@/components/VoiceRecorder", () => ({
  VoiceRecorder: () => <Noop testId="mock-voice-recorder" />,
}));
vi.mock("@/components/Map", () => ({
  default: () => <Noop testId="mock-map" />,
}));
vi.mock("@/components/LiveDeliveryMap", () => ({
  LiveDeliveryMap: () => <Noop testId="mock-live-map" />,
}));
vi.mock("@/components/DriverDeliveryTracker", () => ({
  DriverDeliveryTracker: () => <Noop testId="mock-driver-tracker" />,
}));
vi.mock("@/components/NotificationCenter", () => ({
  NotificationCenter: () => <Noop testId="mock-notification-center" />,
}));
vi.mock("@/components/NotificationPreferences", () => ({
  NotificationPreferences: () => <Noop testId="mock-notification-prefs" />,
}));
vi.mock("@/components/MaintenanceReport", () => ({
  MaintenanceReport: () => <Noop testId="mock-maintenance-report" />,
}));
vi.mock("@/components/LanguageSwitcher", () => ({
  LanguageSwitcher: () => <Noop testId="mock-lang-switcher" />,
}));
vi.mock("@/components/SignatureCanvas", () => ({
  SignatureCanvas: () => <Noop testId="mock-signature" />,
}));
vi.mock("@/components/DeliveryPhotoGallery", () => ({
  DeliveryPhotoGallery: () => <Noop testId="mock-photo-gallery" />,
}));

// Mock framer-motion to avoid IntersectionObserver constructor issues
vi.mock("framer-motion", () => ({
  motion: new Proxy({}, {
    get: (_: any, tag: string) => {
      const comp = ({ children, ...props }: any) => React.createElement(tag, props, children);
      comp.displayName = `motion.${tag}`;
      return comp;
    },
  }),
  AnimatePresence: ({ children }: any) => <>{children}</>,
  useAnimation: () => ({ start: vi.fn(), stop: vi.fn() }),
  useMotionValue: (v: any) => ({ get: () => v, set: vi.fn() }),
  useTransform: () => ({ get: vi.fn() }),
  useSpring: () => ({ get: vi.fn() }),
  useInView: () => true,
  animate: vi.fn(),
  LayoutGroup: ({ children }: any) => <>{children}</>,
}));

// Mock @radix-ui TooltipProvider at module level so ComponentShowcase works
vi.mock("@/components/ui/tooltip", () => ({
  Tooltip: ({ children }: any) => <>{children}</>,
  TooltipTrigger: ({ children }: any) => <>{children}</>,
  TooltipContent: ({ children }: any) => <div>{children}</div>,
  TooltipProvider: ({ children }: any) => <>{children}</>,
}));

// Mock Hover Card (used in ComponentShowcase)
vi.mock("@/components/ui/hover-card", () => ({
  HoverCard: ({ children }: any) => <>{children}</>,
  HoverCardTrigger: ({ children }: any) => <>{children}</>,
  HoverCardContent: ({ children }: any) => <div>{children}</div>,
}));

// Mock ThemeProvider / LanguageContext
vi.mock("@/contexts/ThemeContext", () => ({
  ThemeProvider: ({ children }: { children: React.ReactNode }) => <>{children}</>,
  useTheme: vi.fn(() => ({ theme: "dark", setTheme: vi.fn() })),
}));
vi.mock("@/contexts/LanguageContext", () => ({
  LanguageProvider: ({ children }: { children: React.ReactNode }) => <>{children}</>,
  useLanguage: vi.fn(() => ({
    language: "en",
    setLanguage: vi.fn(),
    t: (key: string) => key,
  })),
}));

// Mock recharts to avoid canvas issues in jsdom
vi.mock("recharts", () => ({
  LineChart: () => <div data-testid="mock-recharts" />,
  BarChart: () => <div data-testid="mock-recharts" />,
  AreaChart: () => <div data-testid="mock-recharts" />,
  PieChart: () => <div data-testid="mock-recharts" />,
  Line: () => null,
  Bar: () => null,
  Area: () => null,
  Pie: () => null,
  Cell: () => null,
  XAxis: () => null,
  YAxis: () => null,
  CartesianGrid: () => null,
  Tooltip: () => null,
  Legend: () => null,
  ResponsiveContainer: ({ children }: { children: React.ReactNode }) => (
    <div>{children}</div>
  ),
}));

// ── Helpers ──────────────────────────────────────────────────────────────────

function renderPage(Page: React.ComponentType) {
  return render(
    <Suspense fallback={<div data-testid="suspense-fallback" />}>
      <Page />
    </Suspense>
  );
}

// ── Smoke Tests ───────────────────────────────────────────────────────────────

describe("Page Smoke Tests – render without crashing", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  // Public / standalone pages
  it("Login renders", async () => {
    const { default: Login } = await import("@/pages/Login");
    renderPage(Login);
    expect(document.body).toBeTruthy();
  });

  it("Register renders", async () => {
    const { default: Register } = await import("@/pages/Register");
    renderPage(Register);
    expect(document.body).toBeTruthy();
  });

  it("NotFound renders", async () => {
    const { default: NotFound } = await import("@/pages/NotFound");
    renderPage(NotFound);
    expect(document.body).toBeTruthy();
  });

  // Dashboard pages (wrapped in DashboardLayout mock)
  it("Home renders", async () => {
    const { default: Home } = await import("@/pages/Home");
    renderPage(Home);
    expect(document.body).toBeTruthy();
  });

  it("Deliveries renders", async () => {
    const { default: Deliveries } = await import("@/pages/Deliveries");
    renderPage(Deliveries);
    expect(document.body).toBeTruthy();
  });

  it("DriverDeliveries renders", async () => {
    const { default: DriverDeliveries } = await import("@/pages/DriverDeliveries");
    renderPage(DriverDeliveries);
    expect(document.body).toBeTruthy();
  });

  it("Documents renders", async () => {
    const { default: Documents } = await import("@/pages/Documents");
    renderPage(Documents);
    expect(document.body).toBeTruthy();
  });

  it("Projects renders", async () => {
    const { default: Projects } = await import("@/pages/Projects");
    renderPage(Projects);
    expect(document.body).toBeTruthy();
  });

  it("Materials renders", async () => {
    const { default: Materials } = await import("@/pages/Materials");
    renderPage(Materials);
    expect(document.body).toBeTruthy();
  });

  it("QualityControl renders", async () => {
    const { default: QualityControl } = await import("@/pages/QualityControl");
    renderPage(QualityControl);
    expect(document.body).toBeTruthy();
  });

  it("Employees renders", async () => {
    const { default: Employees } = await import("@/pages/Employees");
    renderPage(Employees);
    expect(document.body).toBeTruthy();
  });

  it("Machines renders", async () => {
    const { default: Machines } = await import("@/pages/Machines");
    renderPage(Machines);
    expect(document.body).toBeTruthy();
  });

  it("PurchaseOrders renders", async () => {
    const { default: PurchaseOrders } = await import("@/pages/PurchaseOrders");
    renderPage(PurchaseOrders);
    expect(document.body).toBeTruthy();
  });

  it("Suppliers renders", async () => {
    const { default: Suppliers } = await import("@/pages/Suppliers");
    renderPage(Suppliers);
    expect(document.body).toBeTruthy();
  });

  it("Timesheets renders", async () => {
    const { default: Timesheets } = await import("@/pages/Timesheets");
    renderPage(Timesheets);
    expect(document.body).toBeTruthy();
  });

  it("TimesheetSummary renders", async () => {
    const { default: TimesheetSummary } = await import("@/pages/TimesheetSummary");
    renderPage(TimesheetSummary);
    expect(document.body).toBeTruthy();
  });

  it("Settings renders", async () => {
    const { default: Settings } = await import("@/pages/Settings");
    renderPage(Settings);
    expect(document.body).toBeTruthy();
  });

  it("ReportSettings renders", async () => {
    const { default: ReportSettings } = await import("@/pages/ReportSettings");
    renderPage(ReportSettings);
    expect(document.body).toBeTruthy();
  });

  it("EmailBrandingSettings renders", async () => {
    const { default: EmailBrandingSettings } = await import("@/pages/EmailBrandingSettings");
    renderPage(EmailBrandingSettings);
    expect(document.body).toBeTruthy();
  });

  it("EmailTemplateEditor renders", async () => {
    const { default: EmailTemplateEditor } = await import("@/pages/EmailTemplateEditor");
    renderPage(EmailTemplateEditor);
    expect(document.body).toBeTruthy();
  });

  it("AIAssistant renders", async () => {
    const { default: AIAssistant } = await import("@/pages/AIAssistant");
    renderPage(AIAssistant);
    expect(document.body).toBeTruthy();
  });

  it("ForecastingDashboard renders", async () => {
    const { default: ForecastingDashboard } = await import("@/pages/ForecastingDashboard");
    renderPage(ForecastingDashboard);
    expect(document.body).toBeTruthy();
  });

  it("CustomizableDashboard renders", async () => {
    const { default: CustomizableDashboard } = await import(
      "@/pages/CustomizableDashboard"
    );
    renderPage(CustomizableDashboard);
    expect(document.body).toBeTruthy();
  });

  it("ConcreteBaseDashboard renders", async () => {
    const { default: ConcreteBaseDashboard } = await import(
      "@/pages/ConcreteBaseDashboard"
    );
    renderPage(ConcreteBaseDashboard);
    expect(document.body).toBeTruthy();
  });

  it("AggregateInputs renders", async () => {
    const { default: AggregateInputs } = await import("@/pages/AggregateInputs");
    renderPage(AggregateInputs);
    expect(document.body).toBeTruthy();
  });

  it("NotificationTriggersAdmin renders", async () => {
    const { default: NotificationTriggersAdmin } = await import(
      "@/pages/NotificationTriggersAdmin"
    );
    renderPage(NotificationTriggersAdmin);
    expect(document.body).toBeTruthy();
  });

  it("NotificationTemplatesAdmin renders", async () => {
    const { default: NotificationTemplatesAdmin } = await import(
      "@/pages/NotificationTemplatesAdmin"
    );
    renderPage(NotificationTemplatesAdmin);
    expect(document.body).toBeTruthy();
  });

  it("DriverApp renders", async () => {
    const { default: DriverApp } = await import("@/pages/DriverApp");
    renderPage(DriverApp);
    expect(document.body).toBeTruthy();
  });

  it("ChangePassword renders", async () => {
    const { default: ChangePassword } = await import("@/pages/ChangePassword");
    renderPage(ChangePassword);
    expect(document.body).toBeTruthy();
  });

  it("EnhancedDashboard renders", async () => {
    const { default: EnhancedDashboard } = await import("@/pages/EnhancedDashboard");
    renderPage(EnhancedDashboard);
    expect(document.body).toBeTruthy();
  });

  it("DesignSystem renders", async () => {
    const { default: DesignSystem } = await import("@/pages/DesignSystem");
    renderPage(DesignSystem);
    expect(document.body).toBeTruthy();
  });

  it("ComponentShowcase renders", async () => {
    const { default: ComponentShowcase } = await import("@/pages/ComponentShowcase");
    renderPage(ComponentShowcase);
    expect(document.body).toBeTruthy();
  });
});
