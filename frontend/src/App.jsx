import {
  BrowserRouter as Router,
  Routes,
  Route,
  Navigate,
} from "react-router-dom";
import { AuthProvider, useAuth } from "./contexts/AuthContext";
import Login from "./components/Login";
import Signup from "./components/Signup";
import Dashboard from "./components/Dashboard";
import ExpenseForm from "./components/ExpenseForm";
import UserManagement from "./components/UserManagement";
import ApprovalRules from "./components/ApprovalRules";
import UserManagementPanel from "./components/UserManagementPanel";
import RolePermissionPanel from "./components/RolePermissionPanel";
import ApprovalWorkflowPanel from "./components/ApprovalWorkflowPanel";
import ExpenseHistory from "./components/ExpenseHistory";
import Layout from "./components/Layout";
import "./App.css";

function ProtectedRoute({ children }) {
  const { user } = useAuth();
  return user ? children : <Navigate to="/login" />;
}

function AdminRoute({ children }) {
  const { user } = useAuth();
  return user?.role === "admin" ? children : <Navigate to="/dashboard" />;
}

function App() {
  return (
    <AuthProvider>
      <Router future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
        <div className="w-full min-h-screen bg-gray-50">
          <Routes>
            <Route path="/login" element={<Login />} />
            <Route path="/signup" element={<Signup />} />
            <Route path="/" element={<Navigate to="/dashboard" />} />
            <Route
              path="/*"
              element={
                <ProtectedRoute>
                  <Layout>
                    <Routes>
                      <Route path="/dashboard" element={<Dashboard />} />
                      <Route path="/expenses/new" element={<ExpenseForm />} />
                      <Route path="/expenses/history" element={<ExpenseHistory />} />
                      <Route
                        path="/users"
                        element={
                          <AdminRoute>
                            <UserManagement />
                          </AdminRoute>
                        }
                      />
                      <Route
                        path="/approval-rules"
                        element={
                          <AdminRoute>
                            <ApprovalRules />
                          </AdminRoute>
                        }
                      />
                      <Route
                        path="/admin/user-management"
                        element={
                          <AdminRoute>
                            <UserManagementPanel />
                          </AdminRoute>
                        }
                      />
                      <Route
                        path="/admin/role-permissions"
                        element={
                          <AdminRoute>
                            <RolePermissionPanel />
                          </AdminRoute>
                        }
                      />
                      <Route
                        path="/admin/approval-workflows"
                        element={
                          <AdminRoute>
                            <ApprovalWorkflowPanel />
                          </AdminRoute>
                        }
                      />
                    </Routes>
                  </Layout>
                </ProtectedRoute>
              }
            />
          </Routes>
        </div>
      </Router>
    </AuthProvider>
  );
}

export default App;
