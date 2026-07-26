import { BrowserRouter, Routes, Route } from "react-router-dom";

import MainLayout from "../layouts/MainLayout";
import ProtectedRoute from "../components/ProtectedRoute";

import Dashboard from "../pages/Dashboard";
import Clientes from "../pages/Clientes";
import Servicos from "../pages/Servicos";
import Barbeiros from "../pages/Barbeiros";
import Agendamentos from "../pages/Agendamentos";
import Agenda from "../pages/Agenda";
import Historico from "../pages/Historico";
import Login from "../pages/Login";
import Register from "../pages/Register";

function AppRoutes() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route path="/cadastro" element={<Register />} />

        <Route
          element={
            <ProtectedRoute>
              <MainLayout />
            </ProtectedRoute>
          }
        >
          <Route path="/" element={<Dashboard />} />
          <Route path="/clientes" element={<Clientes />} />
          <Route path="/servicos" element={<Servicos />} />
          <Route path="/barbeiros" element={<Barbeiros />} />
          <Route path="/agenda" element={<Agenda />} />
          <Route path="/agendamentos" element={<Agendamentos />} />
          <Route path="/historico" element={<Historico />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}

export default AppRoutes;
