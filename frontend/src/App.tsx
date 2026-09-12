import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { ProtectedRoute } from './components/ProtectedRoute';
import { Navbar } from './components/Navbar';
import { Login } from './pages/Login';
import { Register } from './pages/Register';
import { Dashboard } from './pages/Dashboard';
import { Inspection } from './pages/Inspection';
import { InspectionHistory } from './pages/InspectionHistory';
import { UserApproval } from './pages/admin/UserApproval';
import { EquipmentManager } from './pages/admin/EquipmentManager';

export const App: React.FC = () => {
  return (
    <BrowserRouter>
      <AuthProvider>
        <div className="min-h-screen bg-slate-50 text-slate-900 flex flex-col font-sans">
          <Routes>
            {/* Public Routes */}
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />

            {/* Protected Routes (With Navbar) */}
            <Route element={<ProtectedLayout />}>
              <Route path="/" element={<Navigate to="/dashboard" replace />} />
              <Route path="/dashboard" element={<Dashboard />} />
              <Route path="/inspection" element={<Inspection />} />
              <Route path="/history" element={<InspectionHistory />} />
              <Route path="/admin/equipments" element={<EquipmentManager />} />

              {/* Admin Only Routes */}
              <Route element={<ProtectedRoute requireAdmin={true} />}>
                <Route path="/admin/users" element={<UserApproval />} />
              </Route>
            </Route>

            {/* Fallback */}
            <Route path="*" element={<Navigate to="/dashboard" replace />} />
          </Routes>
        </div>
      </AuthProvider>
    </BrowserRouter>
  );
};

// Layout wrapper for authenticated pages
const ProtectedLayout: React.FC = () => {
  return (
    <ProtectedRoute>
      <Navbar />
      <main className="flex-1 pb-12">
        <Routes>
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/inspection" element={<Inspection />} />
          <Route path="/history" element={<InspectionHistory />} />
          <Route path="/admin/equipments" element={<EquipmentManager />} />
          <Route element={<ProtectedRoute requireAdmin={true} />}>
            <Route path="/admin/users" element={<UserApproval />} />
          </Route>
          <Route path="/" element={<Navigate to="/dashboard" replace />} />
        </Routes>
      </main>
    </ProtectedRoute>
  );
};

export default App;
