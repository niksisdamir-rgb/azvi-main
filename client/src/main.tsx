import { createRoot } from "react-dom/client";
import App from "./App";
import { LanguageProvider } from "./contexts/LanguageContext";
import { AuthProvider } from "./components/AuthProvider";
import { GlobalErrorHandler } from "./components/GlobalErrorHandler";
import ErrorBoundary from "./components/ErrorBoundary";
import "./index.css";

const rootElement = document.getElementById("root");
if (!rootElement) throw new Error("Failed to find the root element");

const root = createRoot(rootElement);

root.render(
  <ErrorBoundary>
    <LanguageProvider>
      <AuthProvider>
        <GlobalErrorHandler>
          <App />
        </GlobalErrorHandler>
      </AuthProvider>
    </LanguageProvider>
  </ErrorBoundary>
);
