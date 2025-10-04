import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { Settings, Plus, X, Edit2 } from "lucide-react";
import axios from "axios";

export default function ApprovalRules() {
  const [rules, setRules] = useState([]);
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
    watch,
  } = useForm();
  const watchRuleType = watch("ruleType");

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [rulesRes, usersRes] = await Promise.all([
        axios.get("/approval-rules"),
        axios.get("/users"),
      ]);
      setRules(rulesRes.data);
      setUsers(usersRes.data);
    } catch (error) {
      setError("Failed to fetch data");
    } finally {
      setLoading(false);
    }
  };

  const onSubmit = async (data) => {
    setError("");
    setSuccess("");

    try {
      // Process form data
      const formData = {
        ...data,
        percentageThreshold: data.percentageThreshold
          ? Number(data.percentageThreshold)
          : undefined,
        specificApprovers: data.specificApprovers
          ? data.specificApprovers.filter((id) => id)
          : [],
        levels: data.approvers
          ? [
              {
                approvers: data.approvers.filter((id) => id),
              },
            ]
          : [],
        conditions: {
          minAmount: data.minAmount ? Number(data.minAmount) : undefined,
          category: data.category || undefined,
        },
      };

      await axios.post("/approval-rules", formData);
      setSuccess("Approval rule created successfully!");
      reset();
      setShowForm(false);
      fetchData();
    } catch (error) {
      setError(error.response?.data?.error || "Failed to create approval rule");
    }
  };

  const ruleTypes = [
    {
      value: "percentage",
      label: "Percentage Based",
      description: "Approve when X% of approvers approve",
    },
    {
      value: "specific",
      label: "Specific Approvers",
      description: "Approve when specific person approves",
    },
    {
      value: "hybrid",
      label: "Hybrid",
      description: "Either percentage OR specific approver",
    },
  ];

  const categories = [
    "travel",
    "meals",
    "accommodation",
    "transportation",
    "office-supplies",
    "software",
    "training",
    "marketing",
    "other",
  ];

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  return (
    <div className="w-full space-y-4 lg:space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center space-y-3 sm:space-y-0">
        <div>
          <h1 className="text-xl lg:text-2xl font-bold text-gray-900">
            Approval Rules
          </h1>
          <p className="mt-1 text-sm text-gray-500">
            Configure approval workflows and conditions
          </p>
        </div>
        <button
          onClick={() => setShowForm(true)}
          className="inline-flex items-center justify-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 w-full sm:w-auto"
        >
          <Plus className="h-4 w-4 mr-2" />
          Add Rule
        </button>
      </div>

      {/* Success/Error Messages */}
      {success && (
        <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded relative">
          <span className="block sm:inline">{success}</span>
        </div>
      )}
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded relative">
          <span className="block sm:inline">{error}</span>
        </div>
      )}

      {/* Add Rule Modal */}
      {showForm && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50 px-4">
          <div className="relative top-10 mx-auto p-5 border w-full max-w-2xl shadow-lg rounded-md bg-white">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-medium text-gray-900">
                Add Approval Rule
              </h3>
              <button
                onClick={() => setShowForm(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                <X className="h-6 w-6" />
              </button>
            </div>

            <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
              {/* Rule Type */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Rule Type
                </label>
                <div className="space-y-2">
                  {ruleTypes.map((type) => (
                    <label key={type.value} className="flex items-start">
                      <input
                        type="radio"
                        value={type.value}
                        {...register("ruleType", {
                          required: "Rule type is required",
                        })}
                        className="mt-1 mr-2"
                      />
                      <div>
                        <div className="font-medium">{type.label}</div>
                        <div className="text-sm text-gray-500">
                          {type.description}
                        </div>
                      </div>
                    </label>
                  ))}
                </div>
                {errors.ruleType && (
                  <p className="mt-1 text-sm text-red-600">
                    {errors.ruleType.message}
                  </p>
                )}
              </div>

              {/* Percentage Threshold */}
              {watchRuleType === "percentage" && (
                <div>
                  <label
                    htmlFor="percentageThreshold"
                    className="block text-sm font-medium text-gray-700"
                  >
                    Percentage Threshold (%)
                  </label>
                  <input
                    type="number"
                    min="1"
                    max="100"
                    {...register("percentageThreshold", {
                      required: "Percentage threshold is required",
                      min: { value: 1, message: "Must be at least 1%" },
                      max: { value: 100, message: "Cannot exceed 100%" },
                    })}
                    className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                    placeholder="e.g., 75"
                  />
                  {errors.percentageThreshold && (
                    <p className="mt-1 text-sm text-red-600">
                      {errors.percentageThreshold.message}
                    </p>
                  )}
                </div>
              )}

              {/* Specific Approvers */}
              {watchRuleType === "specific" && (
                <div>
                  <label className="block text-sm font-medium text-gray-700">
                    Specific Approvers
                  </label>
                  <div className="mt-2 space-y-2 max-h-40 overflow-y-auto">
                    {users
                      .filter((user) => user.role !== "employee")
                      .map((user) => (
                        <label key={user._id} className="flex items-center">
                          <input
                            type="checkbox"
                            value={user._id}
                            {...register("specificApprovers")}
                            className="mr-2"
                          />
                          <span className="text-sm">
                            {user.name} ({user.role})
                          </span>
                        </label>
                      ))}
                  </div>
                </div>
              )}

              {/* General Approvers for percentage and hybrid */}
              {(watchRuleType === "percentage" ||
                watchRuleType === "hybrid") && (
                <div>
                  <label className="block text-sm font-medium text-gray-700">
                    Eligible Approvers
                  </label>
                  <div className="mt-2 space-y-2 max-h-40 overflow-y-auto">
                    {users
                      .filter((user) => user.role !== "employee")
                      .map((user) => (
                        <label key={user._id} className="flex items-center">
                          <input
                            type="checkbox"
                            value={user._id}
                            {...register("approvers")}
                            className="mr-2"
                          />
                          <span className="text-sm">
                            {user.name} ({user.role})
                          </span>
                        </label>
                      ))}
                  </div>
                </div>
              )}

              {/* Conditions */}
              <div className="border-t pt-4">
                <h4 className="text-md font-medium text-gray-900 mb-3">
                  Conditions (Optional)
                </h4>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label
                      htmlFor="minAmount"
                      className="block text-sm font-medium text-gray-700"
                    >
                      Minimum Amount
                    </label>
                    <input
                      type="number"
                      step="0.01"
                      {...register("minAmount")}
                      className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                      placeholder="e.g., 100.00"
                    />
                  </div>

                  <div>
                    <label
                      htmlFor="category"
                      className="block text-sm font-medium text-gray-700"
                    >
                      Category
                    </label>
                    <select
                      {...register("category")}
                      className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                    >
                      <option value="">Any Category</option>
                      {categories.map((category) => (
                        <option key={category} value={category}>
                          {category.charAt(0).toUpperCase() +
                            category.slice(1).replace("-", " ")}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
              </div>

              {/* Form Actions */}
              <div className="flex flex-col sm:flex-row justify-end space-y-2 sm:space-y-0 sm:space-x-3 pt-4">
                <button
                  type="button"
                  onClick={() => setShowForm(false)}
                  className="px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 w-full sm:w-auto"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 w-full sm:w-auto"
                >
                  Create Rule
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Rules List */}
      <div className="bg-white shadow overflow-hidden sm:rounded-md">
        <div className="px-4 py-5 sm:px-6 border-b border-gray-200">
          <h3 className="text-lg leading-6 font-medium text-gray-900">
            Current Rules
          </h3>
          <p className="mt-1 max-w-2xl text-sm text-gray-500">
            Active approval rules in your organization
          </p>
        </div>
        {rules.length === 0 ? (
          <div className="text-center py-12">
            <Settings className="mx-auto h-12 w-12 text-gray-400" />
            <h3 className="mt-2 text-sm font-medium text-gray-900">
              No approval rules
            </h3>
            <p className="mt-1 text-sm text-gray-500">
              Get started by creating your first approval rule.
            </p>
          </div>
        ) : (
          <ul className="divide-y divide-gray-200">
            {rules.map((rule) => (
              <li key={rule._id} className="px-4 py-4 sm:px-6">
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <div className="flex items-center justify-between">
                      <p className="text-sm font-medium text-blue-600 truncate">
                        {rule.ruleType ? 
                          rule.ruleType.charAt(0).toUpperCase() + rule.ruleType.slice(1) :
                          "Unknown"}{" "}
                        Rule
                      </p>
                      <div className="ml-2 flex-shrink-0 flex">
                        <p
                          className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                            rule.isActive
                              ? "bg-green-100 text-green-800"
                              : "bg-red-100 text-red-800"
                          }`}
                        >
                          {rule.isActive ? "Active" : "Inactive"}
                        </p>
                      </div>
                    </div>
                    <div className="mt-2">
                      <p className="text-sm text-gray-600">
                        {rule.ruleType === "percentage" &&
                          `${rule.percentageThreshold || 0}% approval required`}
                        {rule.ruleType === "specific" &&
                          `Specific approvers: ${
                            rule.specificApprovers?.length || 0
                          }`}
                        {rule.ruleType === "hybrid" &&
                          `${rule.percentageThreshold || 0}% OR specific approver`}
                      </p>
                      {rule.conditions?.minAmount && (
                        <p className="text-sm text-gray-500">
                          Minimum amount: ${rule.conditions.minAmount}
                        </p>
                      )}
                      {rule.conditions?.category && (
                        <p className="text-sm text-gray-500">
                          Category: {rule.conditions.category}
                        </p>
                      )}
                    </div>
                  </div>
                  <div className="ml-4 flex-shrink-0">
                    <button className="text-blue-600 hover:text-blue-900">
                      <Edit2 className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
