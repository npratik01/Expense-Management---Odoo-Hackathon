import { useState, useEffect } from "react";
import { useAuth } from "../contexts/AuthContext";
import {
  Users,
  UserPlus,
  Edit,
  Trash2,
  Shield,
  UserCheck,
  User,
  Save,
  X,
  AlertCircle,
} from "lucide-react";
import axios from "axios";

export default function UserManagementPanel() {
  const { user } = useAuth();
  const [users, setUsers] = useState([]);
  const [managers, setManagers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [editingUser, setEditingUser] = useState(null);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const [formData, setFormData] = useState({
    name: "",
    email: "",
    password: "",
    role: "employee",
    manager: "",
    isBillApprover: false,
    approvalLevel: 0,
    approvalLimit: 0,
    department: "",
    managersInSequence: []
  });

  useEffect(() => {
    fetchUsers();
    fetchManagers();
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

  const fetchManagers = async () => {
    try {
      const response = await axios.get("/users/managers");
      setManagers(response.data);
    } catch (error) {
      console.error("Failed to fetch managers");
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setSuccess("");

    try {
      if (editingUser) {
        await axios.put(`/users/${editingUser._id}`, formData);
        setSuccess("User updated successfully");
      } else {
        await axios.post("/users", formData);
        setSuccess("User created successfully");
      }
      
      resetForm();
      fetchUsers();
      fetchManagers();
    } catch (error) {
      setError(error.response?.data?.error || "Operation failed");
    }
  };

  const handleDelete = async (userId) => {
    if (!window.confirm("Are you sure you want to delete this user?")) return;

    try {
      await axios.delete(`/users/${userId}`);
      setSuccess("User deleted successfully");
      fetchUsers();
      fetchManagers();
    } catch (error) {
      setError(error.response?.data?.error || "Failed to delete user");
    }
  };

  const resetForm = () => {
    setFormData({
      name: "",
      email: "",
      password: "",
      role: "employee",
      manager: "",
      isBillApprover: false,
      approvalLevel: 0,
      approvalLimit: 0,
      department: "",
      managersInSequence: []
    });
    setEditingUser(null);
    setShowCreateForm(false);
  };

  const startEdit = (userToEdit) => {
    setEditingUser(userToEdit);
    setFormData({
      name: userToEdit.name,
      email: userToEdit.email,
      password: "",
      role: userToEdit.role,
      manager: userToEdit.manager?._id || "",
      isBillApprover: userToEdit.isBillApprover || false,
      approvalLevel: userToEdit.approvalLevel || 0,
      approvalLimit: userToEdit.approvalLimit || 0,
      department: userToEdit.department || "",
      managersInSequence: userToEdit.managersInSequence || []
    });
    setShowCreateForm(true);
  };

  const addManagerToSequence = () => {
    const newSequence = [...formData.managersInSequence];
    newSequence.push({
      manager: "",
      sequence: newSequence.length + 1,
      approvalLimit: 0
    });
    setFormData({ ...formData, managersInSequence: newSequence });
  };

  const removeManagerFromSequence = (index) => {
    const newSequence = formData.managersInSequence.filter((_, i) => i !== index);
    // Reorder sequences
    newSequence.forEach((item, i) => {
      item.sequence = i + 1;
    });
    setFormData({ ...formData, managersInSequence: newSequence });
  };

  const updateManagerInSequence = (index, field, value) => {
    const newSequence = [...formData.managersInSequence];
    newSequence[index][field] = value;
    setFormData({ ...formData, managersInSequence: newSequence });
  };

  const getRoleIcon = (role) => {
    switch (role) {
      case "admin":
        return <Shield className="h-4 w-4 text-red-600" />;
      case "manager":
        return <UserCheck className="h-4 w-4 text-blue-600" />;
      default:
        return <User className="h-4 w-4 text-green-600" />;
    }
  };

  const getRoleBadge = (role) => {
    const baseClasses = "inline-flex items-center px-2 py-1 rounded-full text-xs font-medium";
    switch (role) {
      case "admin":
        return `${baseClasses} bg-red-100 text-red-800`;
      case "manager":
        return `${baseClasses} bg-blue-100 text-blue-800`;
      default:
        return `${baseClasses} bg-green-100 text-green-800`;
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  return (
    <div className="w-full space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div className="flex items-center space-x-3">
          <Users className="h-8 w-8 text-blue-600" />
          <div>
            <h1 className="text-2xl font-bold text-gray-900">User Management</h1>
            <p className="text-sm text-gray-500">Create and manage users, assign roles and approval hierarchies</p>
          </div>
        </div>
        
        <button
          onClick={() => setShowCreateForm(true)}
          className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg flex items-center space-x-2"
        >
          <UserPlus className="h-4 w-4" />
          <span>Add User</span>
        </button>
      </div>

      {/* Messages */}
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded relative flex items-center">
          <AlertCircle className="h-4 w-4 mr-2" />
          {error}
        </div>
      )}

      {success && (
        <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded relative">
          {success}
        </div>
      )}

      {/* Create/Edit Form */}
      {showCreateForm && (
        <div className="bg-white shadow-lg rounded-lg border border-gray-200">
          <div className="px-6 py-4 border-b border-gray-200">
            <div className="flex justify-between items-center">
              <h3 className="text-lg font-medium text-gray-900">
                {editingUser ? "Edit User" : "Create New User"}
              </h3>
              <button
                onClick={resetForm}
                className="text-gray-400 hover:text-gray-500"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="p-6 space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Basic Information */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Full Name
                </label>
                <input
                  type="text"
                  required
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Email Address
                </label>
                <input
                  type="email"
                  required
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Password {editingUser && "(leave blank to keep current)"}
                </label>
                <input
                  type="password"
                  required={!editingUser}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  value={formData.password}
                  onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Department
                </label>
                <input
                  type="text"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  value={formData.department}
                  onChange={(e) => setFormData({ ...formData, department: e.target.value })}
                />
              </div>

              {/* Role Selection */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Role
                </label>
                <select
                  required
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  value={formData.role}
                  onChange={(e) => setFormData({ ...formData, role: e.target.value })}
                >
                  <option value="employee">Employee</option>
                  <option value="manager">Manager</option>
                  <option value="admin">Administrator</option>
                </select>
              </div>

              {/* Manager Assignment */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Direct Manager
                </label>
                <select
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  value={formData.manager}
                  onChange={(e) => setFormData({ ...formData, manager: e.target.value })}
                >
                  <option value="">No Manager</option>
                  {managers.map((manager) => (
                    <option key={manager._id} value={manager._id}>
                      {manager.name} ({manager.role})
                    </option>
                  ))}
                </select>
              </div>

              {/* Approval Settings */}
              <div className="md:col-span-2 border-t pt-6">
                <h4 className="text-lg font-medium text-gray-900 mb-4">Approval Settings</h4>
                
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                  <div className="flex items-center">
                    <input
                      type="checkbox"
                      id="isBillApprover"
                      className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                      checked={formData.isBillApprover}
                      onChange={(e) => setFormData({ ...formData, isBillApprover: e.target.checked })}
                    />
                    <label htmlFor="isBillApprover" className="ml-2 text-sm text-gray-700">
                      Is Bill Approver
                    </label>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Approval Level
                    </label>
                    <input
                      type="number"
                      min="0"
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      value={formData.approvalLevel}
                      onChange={(e) => setFormData({ ...formData, approvalLevel: parseInt(e.target.value) })}
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Approval Limit ($)
                    </label>
                    <input
                      type="number"
                      min="0"
                      step="0.01"
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      value={formData.approvalLimit}
                      onChange={(e) => setFormData({ ...formData, approvalLimit: parseFloat(e.target.value) })}
                    />
                  </div>
                </div>
              </div>

              {/* Sequential Managers */}
              <div className="md:col-span-2 border-t pt-6">
                <div className="flex justify-between items-center mb-4">
                  <h4 className="text-lg font-medium text-gray-900">Sequential Approval Managers</h4>
                  <button
                    type="button"
                    onClick={addManagerToSequence}
                    className="bg-green-600 hover:bg-green-700 text-white px-3 py-1 rounded text-sm"
                  >
                    Add Manager
                  </button>
                </div>

                {formData.managersInSequence.map((managerSeq, index) => (
                  <div key={index} className="flex items-center space-x-3 mb-3 p-3 bg-gray-50 rounded-md">
                    <div className="flex-1">
                      <select
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                        value={managerSeq.manager}
                        onChange={(e) => updateManagerInSequence(index, 'manager', e.target.value)}
                      >
                        <option value="">Select Manager</option>
                        {managers.map((manager) => (
                          <option key={manager._id} value={manager._id}>
                            {manager.name} ({manager.role})
                          </option>
                        ))}
                      </select>
                    </div>
                    <div className="w-20">
                      <input
                        type="number"
                        placeholder="Limit"
                        className="w-full px-2 py-2 border border-gray-300 rounded-md text-sm"
                        value={managerSeq.approvalLimit}
                        onChange={(e) => updateManagerInSequence(index, 'approvalLimit', parseFloat(e.target.value) || 0)}
                      />
                    </div>
                    <div className="text-sm text-gray-500 w-16">#{managerSeq.sequence}</div>
                    <button
                      type="button"
                      onClick={() => removeManagerFromSequence(index)}
                      className="text-red-600 hover:text-red-800"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                ))}
              </div>
            </div>

            <div className="flex justify-end space-x-3 pt-6 border-t">
              <button
                type="button"
                onClick={resetForm}
                className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-md flex items-center space-x-2"
              >
                <Save className="h-4 w-4" />
                <span>{editingUser ? "Update" : "Create"} User</span>
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Users Table */}
      <div className="bg-white shadow overflow-hidden sm:rounded-md">
        <div className="px-4 py-5 sm:px-6">
          <h3 className="text-lg leading-6 font-medium text-gray-900">
            All Users ({users.length})
          </h3>
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
                    Role
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Manager
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
                {users.map((userData) => (
                  <tr key={userData._id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <div className={`h-8 w-8 rounded-full flex items-center justify-center text-white text-sm font-medium ${
                          userData.role === 'admin' ? 'bg-red-500' :
                          userData.role === 'manager' ? 'bg-blue-500' : 'bg-green-500'
                        }`}>
                          {userData.name.charAt(0).toUpperCase()}
                        </div>
                        <div className="ml-4">
                          <div className="text-sm font-medium text-gray-900">{userData.name}</div>
                          <div className="text-sm text-gray-500">{userData.email}</div>
                          {userData.department && (
                            <div className="text-xs text-gray-400">{userData.department}</div>
                          )}
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={getRoleBadge(userData.role)}>
                        {getRoleIcon(userData.role)}
                        <span className="ml-1 capitalize">{userData.role}</span>
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {userData.manager ? userData.manager.name : "No Manager"}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      <div className="space-y-1">
                        {userData.isBillApprover && (
                          <div className="inline-flex items-center px-2 py-1 rounded-full text-xs bg-green-100 text-green-800">
                            Bill Approver
                          </div>
                        )}
                        {userData.approvalLevel > 0 && (
                          <div className="text-xs text-gray-500">
                            Level {userData.approvalLevel} • ${userData.approvalLimit || 0}
                          </div>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium space-x-2">
                      <button
                        onClick={() => startEdit(userData)}
                        className="text-blue-600 hover:text-blue-900"
                      >
                        <Edit className="h-4 w-4" />
                      </button>
                      {userData._id !== user._id && (
                        <button
                          onClick={() => handleDelete(userData._id)}
                          className="text-red-600 hover:text-red-900"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}