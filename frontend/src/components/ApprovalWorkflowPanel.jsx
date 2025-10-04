import { useState, useEffect } from "react";
import {
  GitBranch,
  Plus,
  Edit,
  Trash2,
  Save,
  X,
  AlertCircle,
  CheckCircle,
  ArrowRight,
  Users,
  DollarSign,
  Settings,
} from "lucide-react";
import axios from "axios";

export default function ApprovalWorkflowPanel() {
  const [workflows, setWorkflows] = useState([]);
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [editingWorkflow, setEditingWorkflow] = useState(null);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const [formData, setFormData] = useState({
    name: "",
    description: "",
    isActive: true,
    priority: 1,
    conditions: {
      minAmount: 0,
      maxAmount: 10000,
      category: "",
      employeeRoles: []
    },
    approvalSteps: []
  });

  useEffect(() => {
    fetchWorkflows();
    fetchUsers();
  }, []);

  const fetchWorkflows = async () => {
    try {
      const response = await axios.get("/approval-rules");
      setWorkflows(response.data);
    } catch (error) {
      setError("Failed to fetch workflows");
    } finally {
      setLoading(false);
    }
  };

  const fetchUsers = async () => {
    try {
      const response = await axios.get("/users");
      setUsers(response.data);
    } catch (error) {
      console.error("Failed to fetch users");
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setSuccess("");

    try {
      if (editingWorkflow) {
        await axios.put(`/approval-rules/${editingWorkflow._id}`, formData);
        setSuccess("Workflow updated successfully");
      } else {
        await axios.post("/approval-rules", formData);
        setSuccess("Workflow created successfully");
      }
      
      resetForm();
      fetchWorkflows();
    } catch (error) {
      setError(error.response?.data?.error || "Operation failed");
    }
  };

  const handleDelete = async (workflowId) => {
    if (!window.confirm("Are you sure you want to delete this workflow?")) return;

    try {
      await axios.delete(`/approval-rules/${workflowId}`);
      setSuccess("Workflow deleted successfully");
      fetchWorkflows();
    } catch (error) {
      setError(error.response?.data?.error || "Failed to delete workflow");
    }
  };

  const resetForm = () => {
    setFormData({
      name: "",
      description: "",
      isActive: true,
      priority: 1,
      conditions: {
        minAmount: 0,
        maxAmount: 10000,
        category: "",
        employeeRoles: []
      },
      approvalSteps: []
    });
    setEditingWorkflow(null);
    setShowCreateForm(false);
  };

  const startEdit = (workflow) => {
    setEditingWorkflow(workflow);
    setFormData({
      name: workflow.name,
      description: workflow.description || "",
      isActive: workflow.isActive,
      priority: workflow.priority || 1,
      conditions: workflow.conditions || {
        minAmount: 0,
        maxAmount: 10000,
        category: "",
        employeeRoles: []
      },
      approvalSteps: workflow.approvalSteps || []
    });
    setShowCreateForm(true);
  };

  const addApprovalStep = () => {
    const newStep = {
      name: "",
      sequence: formData.approvalSteps.length + 1,
      isManagerApprover: false,
      specificApprovers: [],
      roleBasedApprovers: [],
      percentageThreshold: 100,
      isRequired: true,
      skipIfPreviousRejected: true
    };
    setFormData({
      ...formData,
      approvalSteps: [...formData.approvalSteps, newStep]
    });
  };

  const removeApprovalStep = (index) => {
    const newSteps = formData.approvalSteps.filter((_, i) => i !== index);
    // Reorder sequences
    newSteps.forEach((step, i) => {
      step.sequence = i + 1;
    });
    setFormData({ ...formData, approvalSteps: newSteps });
  };

  const updateApprovalStep = (index, field, value) => {
    const newSteps = [...formData.approvalSteps];
    newSteps[index] = { ...newSteps[index], [field]: value };
    setFormData({ ...formData, approvalSteps: newSteps });
  };

  const moveStep = (index, direction) => {
    const newSteps = [...formData.approvalSteps];
    const newIndex = direction === 'up' ? index - 1 : index + 1;
    
    if (newIndex >= 0 && newIndex < newSteps.length) {
      [newSteps[index], newSteps[newIndex]] = [newSteps[newIndex], newSteps[index]];
      // Update sequences
      newSteps.forEach((step, i) => {
        step.sequence = i + 1;
      });
      setFormData({ ...formData, approvalSteps: newSteps });
    }
  };

  const categories = [
    "travel", "meals", "accommodation", "transportation", 
    "office-supplies", "software", "training", "marketing", "other"
  ];

  const getManagerUsers = () => users.filter(u => u.role === 'manager' || u.role === 'admin');

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
          <GitBranch className="h-8 w-8 text-purple-600" />
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Approval Workflow Management</h1>
            <p className="text-sm text-gray-500">Configure sequential approval processes and manager chains</p>
          </div>
        </div>
        
        <button
          onClick={() => setShowCreateForm(true)}
          className="bg-purple-600 hover:bg-purple-700 text-white px-4 py-2 rounded-lg flex items-center space-x-2"
        >
          <Plus className="h-4 w-4" />
          <span>Create Workflow</span>
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
        <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded relative flex items-center">
          <CheckCircle className="h-4 w-4 mr-2" />
          {success}
        </div>
      )}

      {/* Create/Edit Form */}
      {showCreateForm && (
        <div className="bg-white shadow-lg rounded-lg border border-gray-200">
          <div className="px-6 py-4 border-b border-gray-200">
            <div className="flex justify-between items-center">
              <h3 className="text-lg font-medium text-gray-900">
                {editingWorkflow ? "Edit Workflow" : "Create New Workflow"}
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
            {/* Basic Information */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Workflow Name
                </label>
                <input
                  type="text"
                  required
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Priority Level
                </label>
                <input
                  type="number"
                  min="1"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500"
                  value={formData.priority}
                  onChange={(e) => setFormData({ ...formData, priority: parseInt(e.target.value) })}
                />
              </div>

              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Description
                </label>
                <textarea
                  rows={3}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500"
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                />
              </div>

              <div className="flex items-center">
                <input
                  type="checkbox"
                  id="isActive"
                  className="h-4 w-4 text-purple-600 focus:ring-purple-500 border-gray-300 rounded"
                  checked={formData.isActive}
                  onChange={(e) => setFormData({ ...formData, isActive: e.target.checked })}
                />
                <label htmlFor="isActive" className="ml-2 text-sm text-gray-700">
                  Active Workflow
                </label>
              </div>
            </div>

            {/* Conditions */}
            <div className="border-t pt-6">
              <h4 className="text-lg font-medium text-gray-900 mb-4">Application Conditions</h4>
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Minimum Amount ($)
                  </label>
                  <input
                    type="number"
                    min="0"
                    step="0.01"
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500"
                    value={formData.conditions.minAmount}
                    onChange={(e) => setFormData({
                      ...formData,
                      conditions: { ...formData.conditions, minAmount: parseFloat(e.target.value) || 0 }
                    })}
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Maximum Amount ($)
                  </label>
                  <input
                    type="number"
                    min="0"
                    step="0.01"
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500"
                    value={formData.conditions.maxAmount}
                    onChange={(e) => setFormData({
                      ...formData,
                      conditions: { ...formData.conditions, maxAmount: parseFloat(e.target.value) || 0 }
                    })}
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Expense Category
                  </label>
                  <select
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500"
                    value={formData.conditions.category}
                    onChange={(e) => setFormData({
                      ...formData,
                      conditions: { ...formData.conditions, category: e.target.value }
                    })}
                  >
                    <option value="">All Categories</option>
                    {categories.map((category) => (
                      <option key={category} value={category}>
                        {category.charAt(0).toUpperCase() + category.slice(1).replace('-', ' ')}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="mt-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Apply to Employee Roles
                </label>
                <div className="space-y-2">
                  {['employee', 'manager', 'admin'].map((role) => (
                    <label key={role} className="flex items-center">
                      <input
                        type="checkbox"
                        className="h-4 w-4 text-purple-600 focus:ring-purple-500 border-gray-300 rounded"
                        checked={formData.conditions.employeeRoles.includes(role)}
                        onChange={(e) => {
                          const roles = [...formData.conditions.employeeRoles];
                          if (e.target.checked) {
                            roles.push(role);
                          } else {
                            const index = roles.indexOf(role);
                            if (index > -1) roles.splice(index, 1);
                          }
                          setFormData({
                            ...formData,
                            conditions: { ...formData.conditions, employeeRoles: roles }
                          });
                        }}
                      />
                      <span className="ml-2 text-sm text-gray-700 capitalize">{role}s</span>
                    </label>
                  ))}
                </div>
              </div>
            </div>

            {/* Approval Steps */}
            <div className="border-t pt-6">
              <div className="flex justify-between items-center mb-4">
                <h4 className="text-lg font-medium text-gray-900">Approval Steps</h4>
                <button
                  type="button"
                  onClick={addApprovalStep}
                  className="bg-green-600 hover:bg-green-700 text-white px-3 py-1 rounded text-sm flex items-center space-x-1"
                >
                  <Plus className="h-4 w-4" />
                  <span>Add Step</span>
                </button>
              </div>

              {formData.approvalSteps.map((step, index) => (
                <div key={index} className="border border-gray-200 rounded-md p-4 mb-4 bg-gray-50">
                  <div className="flex justify-between items-start mb-3">
                    <h5 className="text-md font-medium text-gray-900">Step {step.sequence}</h5>
                    <div className="flex space-x-2">
                      <button
                        type="button"
                        onClick={() => moveStep(index, 'up')}
                        disabled={index === 0}
                        className="text-gray-500 hover:text-gray-700 disabled:opacity-50"
                      >
                        ↑
                      </button>
                      <button
                        type="button"
                        onClick={() => moveStep(index, 'down')}
                        disabled={index === formData.approvalSteps.length - 1}
                        className="text-gray-500 hover:text-gray-700 disabled:opacity-50"
                      >
                        ↓
                      </button>
                      <button
                        type="button"
                        onClick={() => removeApprovalStep(index)}
                        className="text-red-600 hover:text-red-800"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Step Name
                      </label>
                      <input
                        type="text"
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500"
                        value={step.name}
                        onChange={(e) => updateApprovalStep(index, 'name', e.target.value)}
                        placeholder="e.g., Manager Approval"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Percentage Threshold (%)
                      </label>
                      <input
                        type="number"
                        min="1"
                        max="100"
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500"
                        value={step.percentageThreshold}
                        onChange={(e) => updateApprovalStep(index, 'percentageThreshold', parseInt(e.target.value))}
                      />
                    </div>

                    <div className="md:col-span-2">
                      <div className="space-y-2">
                        <label className="flex items-center">
                          <input
                            type="checkbox"
                            className="h-4 w-4 text-purple-600 focus:ring-purple-500 border-gray-300 rounded"
                            checked={step.isManagerApprover}
                            onChange={(e) => updateApprovalStep(index, 'isManagerApprover', e.target.checked)}
                          />
                          <span className="ml-2 text-sm text-gray-700">Use Employee's Manager as Approver</span>
                        </label>

                        <label className="flex items-center">
                          <input
                            type="checkbox"
                            className="h-4 w-4 text-purple-600 focus:ring-purple-500 border-gray-300 rounded"
                            checked={step.isRequired}
                            onChange={(e) => updateApprovalStep(index, 'isRequired', e.target.checked)}
                          />
                          <span className="ml-2 text-sm text-gray-700">Required Step</span>
                        </label>

                        <label className="flex items-center">
                          <input
                            type="checkbox"
                            className="h-4 w-4 text-purple-600 focus:ring-purple-500 border-gray-300 rounded"
                            checked={step.skipIfPreviousRejected}
                            onChange={(e) => updateApprovalStep(index, 'skipIfPreviousRejected', e.target.checked)}
                          />
                          <span className="ml-2 text-sm text-gray-700">Skip if Previous Step Rejected</span>
                        </label>
                      </div>
                    </div>

                    {!step.isManagerApprover && (
                      <div className="md:col-span-2">
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Specific Approvers
                        </label>
                        <select
                          multiple
                          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500"
                          value={step.specificApprovers}
                          onChange={(e) => {
                            const selectedOptions = Array.from(e.target.selectedOptions).map(option => option.value);
                            updateApprovalStep(index, 'specificApprovers', selectedOptions);
                          }}
                        >
                          {getManagerUsers().map((manager) => (
                            <option key={manager._id} value={manager._id}>
                              {manager.name} ({manager.role})
                            </option>
                          ))}
                        </select>
                        <p className="text-xs text-gray-500 mt-1">Hold Ctrl/Cmd to select multiple</p>
                      </div>
                    )}
                  </div>
                </div>
              ))}

              {formData.approvalSteps.length === 0 && (
                <div className="text-center py-8 text-gray-500">
                  <GitBranch className="h-12 w-12 mx-auto mb-4 text-gray-300" />
                  <p>No approval steps defined. Click "Add Step" to create the first step.</p>
                </div>
              )}
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
                className="bg-purple-600 hover:bg-purple-700 text-white px-4 py-2 rounded-md flex items-center space-x-2"
              >
                <Save className="h-4 w-4" />
                <span>{editingWorkflow ? "Update" : "Create"} Workflow</span>
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Workflows List */}
      <div className="bg-white shadow overflow-hidden sm:rounded-md">
        <div className="px-4 py-5 sm:px-6">
          <h3 className="text-lg leading-6 font-medium text-gray-900">
            Approval Workflows ({workflows.length})
          </h3>
        </div>
        <div className="border-t border-gray-200">
          {workflows.length === 0 ? (
            <div className="text-center py-12">
              <GitBranch className="h-12 w-12 mx-auto mb-4 text-gray-300" />
              <p className="text-gray-500">No approval workflows configured yet.</p>
            </div>
          ) : (
            <div className="space-y-4 p-4">
              {workflows.map((workflow) => (
                <div key={workflow._id} className="border border-gray-200 rounded-lg p-4 hover:bg-gray-50">
                  <div className="flex justify-between items-start mb-3">
                    <div className="flex-1">
                      <div className="flex items-center space-x-3">
                        <h4 className="text-lg font-medium text-gray-900">{workflow.name}</h4>
                        <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                          workflow.isActive ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'
                        }`}>
                          {workflow.isActive ? 'Active' : 'Inactive'}
                        </span>
                        <span className="inline-flex items-center px-2 py-1 rounded-full text-xs bg-blue-100 text-blue-800">
                          Priority: {workflow.priority}
                        </span>
                      </div>
                      {workflow.description && (
                        <p className="text-sm text-gray-600 mt-1">{workflow.description}</p>
                      )}
                    </div>
                    
                    <div className="flex space-x-2">
                      <button
                        onClick={() => startEdit(workflow)}
                        className="text-blue-600 hover:text-blue-900"
                      >
                        <Edit className="h-4 w-4" />
                      </button>
                      <button
                        onClick={() => handleDelete(workflow._id)}
                        className="text-red-600 hover:text-red-900"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </div>

                  {/* Conditions */}
                  <div className="mb-3">
                    <h5 className="text-sm font-medium text-gray-700 mb-2">Conditions:</h5>
                    <div className="flex flex-wrap gap-2 text-xs">
                      {workflow.conditions?.minAmount > 0 && (
                        <span className="bg-yellow-100 text-yellow-800 px-2 py-1 rounded">
                          Min: ${workflow.conditions.minAmount}
                        </span>
                      )}
                      {workflow.conditions?.maxAmount && (
                        <span className="bg-yellow-100 text-yellow-800 px-2 py-1 rounded">
                          Max: ${workflow.conditions.maxAmount}
                        </span>
                      )}
                      {workflow.conditions?.category && (
                        <span className="bg-purple-100 text-purple-800 px-2 py-1 rounded">
                          Category: {workflow.conditions.category}
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Approval Steps */}
                  <div>
                    <h5 className="text-sm font-medium text-gray-700 mb-2">
                      Approval Flow ({workflow.approvalSteps?.length || 0} steps):
                    </h5>
                    <div className="flex items-center space-x-2 overflow-x-auto">
                      {workflow.approvalSteps?.map((step, index) => (
                        <div key={index} className="flex items-center space-x-2 flex-shrink-0">
                          <div className="bg-blue-100 text-blue-800 px-3 py-1 rounded-md text-sm">
                            {step.name}
                            {step.isManagerApprover && (
                              <span className="ml-1 text-xs">(Manager)</span>
                            )}
                          </div>
                          {index < workflow.approvalSteps.length - 1 && (
                            <ArrowRight className="h-4 w-4 text-gray-400" />
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}