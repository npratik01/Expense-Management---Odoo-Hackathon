import { useState, useEffect } from "react";
import { useAuth } from "../contexts/AuthContext";
import {
  Clock,
  CheckCircle,
  XCircle,
  DollarSign,
  FileText,
} from "lucide-react";
import axios from "axios";

export default function Dashboard() {
  const { user } = useAuth();
  const [expenses, setExpenses] = useState([]);
  const [pendingApprovals, setPendingApprovals] = useState([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState("");

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [expensesRes, pendingRes] = await Promise.all([
        axios.get("/expenses/mine"),
        user?.role !== "employee"
          ? axios.get("/expenses/pending")
          : Promise.resolve({ data: [] }),
      ]);
      setExpenses(expensesRes.data);
      setPendingApprovals(pendingRes.data);
    } catch (error) {
      console.error("Error fetching data:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleApprovalAction = async (expenseId, action, comment = "") => {
    setActionLoading(expenseId);
    try {
      await axios.post(`/expenses/${expenseId}/action`, {
        action,
        comment,
      });
      await fetchData(); // Refresh data
    } catch (error) {
      console.error("Error processing approval:", error);
    } finally {
      setActionLoading("");
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case "approved":
        return <CheckCircle className="h-5 w-5 text-green-500" />;
      case "rejected":
        return <XCircle className="h-5 w-5 text-red-500" />;
      case "pending":
      case "partially_approved":
        return <Clock className="h-5 w-5 text-yellow-500" />;
      default:
        return <FileText className="h-5 w-5 text-gray-500" />;
    }
  };

  const formatCurrency = (amount, currency = "USD") => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: currency,
    }).format(amount);
  };

  const formatDate = (date) => {
    return new Date(date).toLocaleDateString();
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
      <div className="border-b border-gray-200 pb-5">
        <h1 className="text-2xl font-bold text-gray-900">
          Welcome back, {user?.name}!
        </h1>
        <p className="mt-1 text-sm text-gray-500">
          Here's what's happening with your expenses
        </p>
      </div>

      {/* Stats */}
      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 lg:gap-6 mb-6 lg:mb-8">
        <div className="bg-white overflow-hidden shadow rounded-lg">
          <div className="p-4 lg:p-5">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <FileText className="h-6 w-6 text-gray-400" />
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 truncate">
                    Total Expenses
                  </dt>
                  <dd className="text-lg font-medium text-gray-900">
                    {expenses.length}
                  </dd>
                </dl>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white overflow-hidden shadow rounded-lg">
          <div className="p-5">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <CheckCircle className="h-6 w-6 text-green-400" />
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 truncate">
                    Approved
                  </dt>
                  <dd className="text-lg font-medium text-gray-900">
                    {expenses.filter((e) => e.status === "approved").length}
                  </dd>
                </dl>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white overflow-hidden shadow rounded-lg">
          <div className="p-5">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <Clock className="h-6 w-6 text-yellow-400" />
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 truncate">
                    Pending
                  </dt>
                  <dd className="text-lg font-medium text-gray-900">
                    {
                      expenses.filter(
                        (e) =>
                          e.status === "pending" ||
                          e.status === "partially_approved"
                      ).length
                    }
                  </dd>
                </dl>
              </div>
            </div>
          </div>
        </div>

        {(user?.role === "manager" || user?.role === "admin") && (
          <div className="bg-white overflow-hidden shadow rounded-lg">
            <div className="p-5">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <DollarSign className="h-6 w-6 text-blue-400" />
                </div>
                <div className="ml-5 w-0 flex-1">
                  <dl>
                    <dt className="text-sm font-medium text-gray-500 truncate">
                      Awaiting Approval
                    </dt>
                    <dd className="text-lg font-medium text-gray-900">
                      {pendingApprovals.length}
                    </dd>
                  </dl>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Pending Approvals (for managers/admins) */}
      {(user?.role === "manager" || user?.role === "admin") &&
        pendingApprovals.length > 0 && (
          <div className="bg-white shadow overflow-hidden sm:rounded-md">
            <div className="px-4 py-4 sm:px-6 lg:py-5">
              <h3 className="text-lg leading-6 font-medium text-gray-900">
                Pending Approvals
              </h3>
              <p className="mt-1 max-w-2xl text-sm text-gray-500">
                Expenses waiting for your approval
              </p>
            </div>
            <ul className="divide-y divide-gray-200">
              {pendingApprovals.map((expense) => (
                <li key={expense._id} className="px-4 py-4 sm:px-6">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center">
                      <div className="flex-shrink-0">
                        {getStatusIcon(expense.status)}
                      </div>
                      <div className="ml-4">
                        <div className="text-sm font-medium text-gray-900">
                          {expense.description || expense.category}
                        </div>
                        <div className="text-sm text-gray-500">
                          {formatCurrency(expense.amount, expense.currency)} •{" "}
                          {formatDate(expense.date)}
                        </div>
                      </div>
                    </div>
                    <div className="flex flex-col sm:flex-row space-y-2 sm:space-y-0 sm:space-x-2">
                      <button
                        onClick={() =>
                          handleApprovalAction(expense._id, "approve")
                        }
                        disabled={actionLoading === expense._id}
                        className="inline-flex items-center px-3 py-1 border border-transparent text-xs font-medium rounded-full shadow-sm text-white bg-green-600 hover:bg-green-700 disabled:opacity-50"
                      >
                        Approve
                      </button>
                      <button
                        onClick={() =>
                          handleApprovalAction(expense._id, "reject")
                        }
                        disabled={actionLoading === expense._id}
                        className="inline-flex items-center px-3 py-1 border border-transparent text-xs font-medium rounded-full shadow-sm text-white bg-red-600 hover:bg-red-700 disabled:opacity-50"
                      >
                        Reject
                      </button>
                    </div>
                  </div>
                </li>
              ))}
            </ul>
          </div>
        )}

      {/* Recent Expenses */}
      <div className="bg-white shadow overflow-hidden sm:rounded-md">
        <div className="px-4 py-4 sm:px-6 lg:py-5">
          <h3 className="text-lg leading-6 font-medium text-gray-900">
            Recent Expenses
          </h3>
          <p className="mt-1 max-w-2xl text-sm text-gray-500">
            Your latest expense submissions
          </p>
        </div>
        {expenses.length === 0 ? (
          <div className="text-center py-12">
            <FileText className="mx-auto h-12 w-12 text-gray-400" />
            <h3 className="mt-2 text-sm font-medium text-gray-900">
              No expenses
            </h3>
            <p className="mt-1 text-sm text-gray-500">
              Get started by submitting your first expense.
            </p>
          </div>
        ) : (
          <ul className="divide-y divide-gray-200">
            {expenses.slice(0, 10).map((expense) => (
              <li key={expense._id} className="px-4 py-4 sm:px-6">
                <div className="flex items-center justify-between">
                  <div className="flex items-center">
                    <div className="flex-shrink-0">
                      {getStatusIcon(expense.status)}
                    </div>
                    <div className="ml-4">
                      <div className="text-sm font-medium text-gray-900">
                        {expense.description || expense.category}
                      </div>
                      <div className="text-sm text-gray-500">
                        {formatCurrency(expense.amount, expense.currency)} •{" "}
                        {formatDate(expense.date)}
                      </div>
                    </div>
                  </div>
                  <div className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium capitalize">
                    <span
                      className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                        expense.status === "approved"
                          ? "bg-green-100 text-green-800"
                          : expense.status === "rejected"
                          ? "bg-red-100 text-red-800"
                          : "bg-yellow-100 text-yellow-800"
                      }`}
                    >
                      {expense.status.replace("_", " ")}
                    </span>
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
