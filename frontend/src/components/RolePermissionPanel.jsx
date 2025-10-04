import { useState, useEffect } from "react";
import {
  Shield,
  Users,
  UserCheck,
  Settings,
  Edit,
  Save,
  X,
  AlertCircle,
  CheckCircle,
} from "lucide-react";
import axios from "axios";

export default function RolePermissionPanel() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editingRoles, setEditingRoles] = useState({});
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const roleDefinitions = {
    admin: {
      name: "Administrator",
      description: "Full system access with all administrative privileges",
      icon: <Shield className="h-5 w-5 text-red-600" />,
      color: "red",
      permissions: [
        "Create and manage users",
        "Configure approval workflows", 
        "View all company expenses",
        "Access system settings",
        "Delete users and data",
        "Manage approval rules",
        "Override approval decisions"
      ]
    },
    manager: {
      name: "Manager",
      description: "Team leadership with approval and oversight capabilities",
      icon: <UserCheck className="h-5 w-5 text-blue-600" />,
      color: "blue", 
      permissions: [
        "Approve/reject expenses",
        "View team member expenses",
        "Submit own expenses",
        "View team analytics",
        "Manage direct reports (if enabled)",
        "Set approval limits for team"
      ]
    },
    employee: {
      name: "Employee",
      description: "Standard user with expense submission capabilities",
      icon: <Users className="h-5 w-5 text-green-600" />,
      color: "green",
      permissions: [
        "Submit expense reports",
        "Upload receipt images", 
        "View own expense history",
        "Track approval status",
        "Edit pending expenses"
      ]
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    try {
      const response = await axios.get("/users");
      setUsers(response.data);
    } catch (error) {
      setError("Failed to fetch users");
    } finally {
      setLoading(false);
    }
  };

  const handleRoleChange = async (userId, newRole) => {
    setError("");
    setSuccess("");

    try {
      await axios.put(`/users/${userId}`, { role: newRole });
      setSuccess(`Role updated successfully`);
      fetchUsers();
      
      // Clear editing state
      const newEditingRoles = { ...editingRoles };
      delete newEditingRoles[userId];
      setEditingRoles(newEditingRoles);
    } catch (error) {
      setError(error.response?.data?.error || "Failed to update role");
    }
  };

  const handleApprovalSettingsChange = async (userId, settings) => {
    setError("");
    setSuccess("");

    try {
      await axios.put(`/users/${userId}`, settings);
      setSuccess(`Approval settings updated successfully`);
      fetchUsers();
      
      // Clear editing state
      const newEditingRoles = { ...editingRoles };
      delete newEditingRoles[userId];
      setEditingRoles(newEditingRoles);
    } catch (error) {
      setError(error.response?.data?.error || "Failed to update approval settings");
    }
  };

  const startEditing = (userId, userData) => {
    setEditingRoles({
      ...editingRoles,
      [userId]: {
        role: userData.role,
        isBillApprover: userData.isBillApprover || false,
        approvalLevel: userData.approvalLevel || 0,
        approvalLimit: userData.approvalLimit || 0
      }
    });
  };

  const cancelEditing = (userId) => {
    const newEditingRoles = { ...editingRoles };
    delete newEditingRoles[userId];
    setEditingRoles(newEditingRoles);
  };

  const updateEditingRole = (userId, field, value) => {
    setEditingRoles({
      ...editingRoles,
      [userId]: {
        ...editingRoles[userId],
        [field]: value
      }
    });
  };

  const saveRoleChanges = (userId) => {
    const changes = editingRoles[userId];
    if (changes.role !== users.find(u => u._id === userId).role) {
      handleRoleChange(userId, changes.role);
    } else {
      handleApprovalSettingsChange(userId, {
        isBillApprover: changes.isBillApprover,
        approvalLevel: changes.approvalLevel,
        approvalLimit: changes.approvalLimit
      });
    }
  };

  const getRoleStats = () => {
    const stats = {
      admin: users.filter(u => u.role === 'admin').length,
      manager: users.filter(u => u.role === 'manager').length,
      employee: users.filter(u => u.role === 'employee').length,
      approvers: users.filter(u => u.isBillApprover).length
    };
    return stats;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  const stats = getRoleStats();

  return (
    <div className="w-full space-y-6">
      {/* Header */}
      <div className="flex items-center space-x-3">
        <Settings className="h-8 w-8 text-purple-600" />
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Role & Permission Management</h1>
          <p className="text-sm text-gray-500">Manage user roles and approval permissions</p>
        </div>
      </div>

      {/* Messages */}
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded relative flex items-center">
          <AlertCircle className="h-4 w-4 mr-2" />
          {error}
        </div>
      )}

      {success && (
        <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded relative flex items-center">
          <CheckCircle className="h-4 w-4 mr-2" />
          {success}
        </div>
      )}

      {/* Role Statistics */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white p-6 rounded-lg shadow border border-red-200">
          <div className="flex items-center">
            <Shield className="h-8 w-8 text-red-600" />
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Administrators</p>
              <p className="text-2xl font-bold text-red-600">{stats.admin}</p>
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow border border-blue-200">
          <div className="flex items-center">
            <UserCheck className="h-8 w-8 text-blue-600" />
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Managers</p>
              <p className="text-2xl font-bold text-blue-600">{stats.manager}</p>
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow border border-green-200">
          <div className="flex items-center">
            <Users className="h-8 w-8 text-green-600" />
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Employees</p>
              <p className="text-2xl font-bold text-green-600">{stats.employee}</p>
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow border border-purple-200">
          <div className="flex items-center">
            <CheckCircle className="h-8 w-8 text-purple-600" />
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Bill Approvers</p>
              <p className="text-2xl font-bold text-purple-600">{stats.approvers}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Role Definitions */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {Object.entries(roleDefinitions).map(([roleKey, role]) => (
          <div key={roleKey} className="bg-white rounded-lg shadow border border-gray-200">
            <div className={`px-6 py-4 border-b border-gray-200 bg-${role.color}-50`}>
              <div className="flex items-center space-x-3">
                {role.icon}
                <div>
                  <h3 className="text-lg font-medium text-gray-900">{role.name}</h3>
                  <p className="text-sm text-gray-600">{role.description}</p>
                </div>
              </div>
            </div>
            <div className="px-6 py-4">
              <h4 className="text-sm font-medium text-gray-900 mb-3">Permissions:</h4>
              <ul className="space-y-2">
                {role.permissions.map((permission, index) => (
                  <li key={index} className="flex items-start space-x-2">
                    <CheckCircle className="h-4 w-4 text-green-500 mt-0.5 flex-shrink-0" />
                    <span className="text-sm text-gray-600">{permission}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        ))}
      </div>

      {/* User Role Management Table */}
      <div className="bg-white shadow overflow-hidden sm:rounded-md">
        <div className="px-4 py-5 sm:px-6">
          <h3 className="text-lg leading-6 font-medium text-gray-900">
            User Role Assignments
          </h3>
          <p className="mt-1 text-sm text-gray-500">
            Manage individual user roles and approval permissions
          </p>
        </div>
        <div className="border-t border-gray-200">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    User
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Current Role
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Approval Status
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Approval Settings
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {users.map((userData) => {
                  const isEditing = editingRoles[userData._id];
                  const currentRole = roleDefinitions[userData.role];
                  
                  return (
                    <tr key={userData._id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <div className={`h-8 w-8 rounded-full flex items-center justify-center text-white text-sm font-medium bg-${currentRole.color}-500`}>
                            {userData.name.charAt(0).toUpperCase()}
                          </div>
                          <div className="ml-4">
                            <div className="text-sm font-medium text-gray-900">{userData.name}</div>
                            <div className="text-sm text-gray-500">{userData.email}</div>
                          </div>
                        </div>
                      </td>
                      
                      <td className="px-6 py-4 whitespace-nowrap">
                        {isEditing ? (
                          <select
                            className="border border-gray-300 rounded px-2 py-1 text-sm"
                            value={isEditing.role}
                            onChange={(e) => updateEditingRole(userData._id, 'role', e.target.value)}
                          >
                            <option value="employee">Employee</option>
                            <option value="manager">Manager</option>
                            <option value="admin">Administrator</option>
                          </select>
                        ) : (
                          <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-${currentRole.color}-100 text-${currentRole.color}-800`}>
                            {currentRole.icon}
                            <span className="ml-1">{currentRole.name}</span>
                          </span>
                        )}
                      </td>

                      <td className="px-6 py-4 whitespace-nowrap">
                        {isEditing ? (
                          <label className="flex items-center">
                            <input
                              type="checkbox"
                              className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                              checked={isEditing.isBillApprover}
                              onChange={(e) => updateEditingRole(userData._id, 'isBillApprover', e.target.checked)}
                            />
                            <span className="ml-2 text-sm text-gray-700">Bill Approver</span>
                          </label>
                        ) : (
                          <span>
                            {userData.isBillApprover ? (
                              <span className="inline-flex items-center px-2 py-1 rounded-full text-xs bg-green-100 text-green-800">
                                <CheckCircle className="h-3 w-3 mr-1" />
                                Approver
                              </span>
                            ) : (
                              <span className="text-sm text-gray-500">Not Approver</span>
                            )}
                          </span>
                        )}
                      </td>

                      <td className="px-6 py-4 whitespace-nowrap">
                        {isEditing ? (
                          <div className="space-y-2">
                            <input
                              type="number"
                              placeholder="Level"
                              className="w-16 px-2 py-1 border border-gray-300 rounded text-sm"
                              value={isEditing.approvalLevel}
                              onChange={(e) => updateEditingRole(userData._id, 'approvalLevel', parseInt(e.target.value) || 0)}
                            />
                            <input
                              type="number"
                              placeholder="Limit $"
                              className="w-20 px-2 py-1 border border-gray-300 rounded text-sm"
                              value={isEditing.approvalLimit}
                              onChange={(e) => updateEditingRole(userData._id, 'approvalLimit', parseFloat(e.target.value) || 0)}
                            />
                          </div>
                        ) : (
                          <div className="text-sm text-gray-900">
                            {userData.approvalLevel > 0 ? (
                              <>
                                <div>Level: {userData.approvalLevel}</div>
                                <div>Limit: ${userData.approvalLimit || 0}</div>
                              </>
                            ) : (
                              <span className="text-gray-500">No limits set</span>
                            )}
                          </div>
                        )}
                      </td>

                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                        {isEditing ? (
                          <div className="flex space-x-2">
                            <button
                              onClick={() => saveRoleChanges(userData._id)}
                              className="text-green-600 hover:text-green-900"
                            >
                              <Save className="h-4 w-4" />
                            </button>
                            <button
                              onClick={() => cancelEditing(userData._id)}
                              className="text-gray-600 hover:text-gray-900"
                            >
                              <X className="h-4 w-4" />
                            </button>
                          </div>
                        ) : (
                          <button
                            onClick={() => startEditing(userData._id, userData)}
                            className="text-blue-600 hover:text-blue-900"
                          >
                            <Edit className="h-4 w-4" />
                          </button>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}