import { Outlet } from "react-router-dom";

import Sidebar from "../components/Sidebar";
import Header from "../components/Header";

function MainLayout({ children }) {
  return (
    <div className="flex min-h-screen bg-surface-secondary">
      <Sidebar />

      <div className="flex-1 flex flex-col min-w-0">
        <Header />

        <main className="p-4 md:p-6 overflow-x-auto">
          {children || <Outlet />}
        </main>
      </div>
    </div>
  );
}

export default MainLayout;
