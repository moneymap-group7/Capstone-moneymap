import { Routes, Route, Navigate } from "react-router-dom";

import Landing from "../pages/Landing";
import Login from "../pages/Login";
import Register from "../pages/Register";
import Dashboard from "../pages/Dashboard";
import UploadStatement from "../pages/UploadStatement";
import Transactions from "../pages/Transactions";
import Categories from "../pages/Categories";
<<<<<<< HEAD
import BudgetPage from "../pages/BudgetPage";
import InsightsPage from "../pages/InsightsPage";
import RulesPage from "../pages/RulesPage";
=======
>>>>>>> origin/main

import ProtectedRoute from "./ProtectedRoute";


export default function AppRoutes() {
  return (
    <Routes>
      {/* Public Routes */}
      <Route path="/" element={<Landing />} />
      <Route path="/login" element={<Login />} />
      <Route path="/register" element={<Register />} />

      {/* Protected Routes */}
      <Route element={<ProtectedRoute />}>
        <Route path="/dashboard" element={<Dashboard />} />
        <Route path="/upload" element={<UploadStatement />} />
        <Route path="/transactions" element={<Transactions />} />
        <Route path="/categories" element={<Categories />} />
<<<<<<< HEAD
        <Route path="/budget" element={<BudgetPage />} /> 
        <Route path="/insights" element={<InsightsPage />} />
        <Route path="/rules" element={<RulesPage />} />
=======
>>>>>>> origin/main
      </Route>

      {/* Fallback */}
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}