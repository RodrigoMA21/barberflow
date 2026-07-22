import { NotificationProvider } from "./components/Notification";
import AppRoutes from "./routes/AppRoutes";

function App() {
  return (
    <NotificationProvider>
      <AppRoutes />
    </NotificationProvider>
  );
}

export default App;
