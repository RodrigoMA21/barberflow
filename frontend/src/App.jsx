import "./i18n";
import { NotificationProvider } from "./components/Notification";
import { ThemeProvider } from "./theme/ThemeContext";
import AppRoutes from "./routes/AppRoutes";

function App() {
  return (
    <ThemeProvider>
      <NotificationProvider>
        <AppRoutes />
      </NotificationProvider>
    </ThemeProvider>
  );
}

export default App;
