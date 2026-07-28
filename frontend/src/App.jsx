import "./i18n";
import { NotificationProvider } from "./components/Notification";
import { ThemeProvider } from "./theme/ThemeContext";
import AppRoutes from "./routes/AppRoutes";
import ErrorBoundary from "./components/ErrorBoundary";

function App() {
  return (
    <ThemeProvider>
      <NotificationProvider>
        <ErrorBoundary>
          <AppRoutes />
        </ErrorBoundary>
      </NotificationProvider>
    </ThemeProvider>
  );
}

export default App;
