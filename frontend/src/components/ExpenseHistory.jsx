import React, { useState, useEffect } from "react";
import { useAuth } from "../contexts/AuthContext";
import { 
  Calendar, 
  DollarSign, 
  FileText, 
  Clock, 
  CheckCircle, 
  XCircle, 
  Eye,
  Download,
  Filter,
  Search,
  RefreshCw
} from "lucide-react";
import axios from "axios";

export default function ExpenseHistory() {
  const { user } = useAuth();
  const [expenses, setExpenses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedExpense, setSelectedExpense] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [filters, setFilters] = useState({
    status: "all",
    category: "all",
    dateRange: "all",
    search: ""
  });

  useEffect(() => {
    fetchExpenses();
  }, [filters]);

  const fetchExpenses = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (filters.status !== "all") params.append("status", filters.status);
      if (filters.category !== "all") params.append("category", filters.category);
      if (filters.dateRange !== "all") params.append("dateRange", filters.dateRange);
      if (filters.search) params.append("search", filters.search);

      const response = await axios.get(`/api/expenses/mine?${params.toString()}`);
      setExpenses(response.data);
    } catch (error) {
      console.error("Error fetching expenses:", error);
    } finally {
      setLoading(false);
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case "approved":
        return <CheckCircle className="h-5 w-5 text-green-500" />;
      case "rejected":
        return <XCircle className="h-5 w-5 text-red-500" />;
      case "pending":
        return <Clock className="h-5 w-5 text-yellow-500" />;
      case "partially_approved":
        return <Clock className="h-5 w-5 text-blue-500" />;
      default:
        return <FileText className="h-5 w-5 text-gray-500" />;
    }
  };

  const getStatusBadge = (status) => {
    const baseClasses = "px-2 inline-flex text-xs leading-5 font-semibold rounded-full";
    switch (status) {
      case "approved":
        return `${baseClasses} bg-green-100 text-green-800`;
      case "rejected":
        return `${baseClasses} bg-red-100 text-red-800`;
      case "pending":
        return `${baseClasses} bg-yellow-100 text-yellow-800`;
      case "partially_approved":
        return `${baseClasses} bg-blue-100 text-blue-800`;
      default:
        return `${baseClasses} bg-gray-100 text-gray-800`;
    }
  };

  const formatCurrency = (amount, currency) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: currency || 'USD',
    }).format(amount);
  };

  const formatDate = (date) => {
    return new Date(date).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  const handleViewDetails = (expense) => {
    setSelectedExpense(expense);
    setShowModal(true);
  };

  const downloadReceipt = (receiptUrl, expenseId) => {
    if (receiptUrl) {
      const link = document.createElement('a');
      link.href = receiptUrl;
      link.download = `receipt-${expenseId}`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    }
  };

  const categories = [
    "travel", "meals", "accommodation", "transportation", 
    "office-supplies", "software", "training", "marketing", "other"
  ];

  return (
    <div className="w-full max-w-7xl mx-auto">
      <div className="mb-8">
        <div className="md:flex md:items-center md:justify-between">
          <div className="flex-1 min-w-0">
            <h2 className="text-2xl font-bold leading-7 text-gray-900 sm:text-3xl sm:truncate">
              My Expense History
            </h2>
            <p className="mt-1 text-sm text-gray-500">
              Track the status of your submitted expenses and download receipts
            </p>
          </div>
          <div className="mt-4 flex md:mt-0 md:ml-4">
            <button
              onClick={fetchExpenses}
              className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
            >
              <RefreshCw className="h-4 w-4 mr-2" />
              Refresh
            </button>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white shadow rounded-lg mb-6">
        <div className="px-4 py-5 sm:p-6">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <div>
              <label htmlFor="search" className="block text-sm font-medium text-gray-700">
                Search
              </label>
              <div className="mt-1 relative rounded-md shadow-sm">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Search className="h-4 w-4 text-gray-400" />
                </div>
                <input
                  type="text"
                  id="search"
                  className="focus:ring-blue-500 focus:border-blue-500 block w-full pl-10 sm:text-sm border-gray-300 rounded-md"
                  placeholder="Search expenses..."
                  value={filters.search}
                  onChange={(e) => setFilters(prev => ({ ...prev, search: e.target.value }))}
                />
              </div>
            </div>

            <div>
              <label htmlFor="status" className="block text-sm font-medium text-gray-700">
                Status
              </label>
              <select
                id="status"
                className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm rounded-md"
                value={filters.status}
                onChange={(e) => setFilters(prev => ({ ...prev, status: e.target.value }))}
              >
                <option value="all">All Status</option>
                <option value="pending">Pending</option>
                <option value="approved">Approved</option>
                <option value="rejected">Rejected</option>
                <option value="partially_approved">Partially Approved</option>
              </select>
            </div>

            <div>
              <label htmlFor="category" className="block text-sm font-medium text-gray-700">
                Category
              </label>
              <select
                id="category"
                className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm rounded-md"
                value={filters.category}
                onChange={(e) => setFilters(prev => ({ ...prev, category: e.target.value }))}
              >
                <option value="all">All Categories</option>
                {categories.map((category) => (
                  <option key={category} value={category}>
                    {category.replace("-", " ").replace(/\b\w/g, (l) => l.toUpperCase())}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label htmlFor="dateRange" className="block text-sm font-medium text-gray-700">
                Date Range
              </label>
              <select
                id="dateRange"
                className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm rounded-md"
                value={filters.dateRange}
                onChange={(e) => setFilters(prev => ({ ...prev, dateRange: e.target.value }))}
              >
                <option value="all">All Time</option>
                <option value="thisMonth">This Month</option>
                <option value="lastMonth">Last Month</option>
                <option value="thisQuarter">This Quarter</option>
                <option value="thisYear">This Year</option>
              </select>
            </div>
          </div>
        </div>
      </div>

      {/* Expense List */}
      <div className="bg-white shadow overflow-hidden sm:rounded-md">
        <ul className="divide-y divide-gray-200">
          {loading ? (
            <div className="text-center py-12">
              <RefreshCw className="mx-auto h-12 w-12 text-gray-400 animate-spin" />
              <h3 className="mt-2 text-sm font-medium text-gray-900">Loading expenses...</h3>
            </div>
          ) : expenses.length === 0 ? (
            <div className="text-center py-12">
              <FileText className="mx-auto h-12 w-12 text-gray-400" />
              <h3 className="mt-2 text-sm font-medium text-gray-900">No expenses found</h3>
              <p className="mt-1 text-sm text-gray-500">
                Get started by submitting your first expense.
              </p>
            </div>
          ) : (
            expenses.map((expense) => (
              <li key={expense._id}>
                <div className="px-4 py-4 sm:px-6">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center">
                      {getStatusIcon(expense.status)}
                      <div className="ml-4 flex-1">
                        <div className="flex items-center justify-between">
                          <p className="text-sm font-medium text-blue-600 truncate">
                            {expense.description || "No description"}
                          </p>
                          <div className="ml-2 flex-shrink-0 flex">
                            <p className={getStatusBadge(expense.status)}>
                              {expense.status.replace("_", " ").replace(/\b\w/g, (l) => l.toUpperCase())}
                            </p>
                          </div>
                        </div>
                        <div className="mt-2 flex items-center text-sm text-gray-500">
                          <DollarSign className="flex-shrink-0 mr-1.5 h-4 w-4 text-gray-400" />
                          <p>
                            {formatCurrency(expense.amount, expense.currency)} • 
                            <span className="ml-1 capitalize">
                              {expense.category?.replace("-", " ")}
                            </span>
                          </p>
                          <Calendar className="flex-shrink-0 ml-4 mr-1.5 h-4 w-4 text-gray-400" />
                          <p>{formatDate(expense.date)}</p>
                        </div>
                      </div>
                    </div>
                    <div className="flex space-x-2">
                      <button
                        onClick={() => handleViewDetails(expense)}
                        className="inline-flex items-center p-2 border border-transparent rounded-full shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                      >
                        <Eye className="h-4 w-4" />
                      </button>
                      {expense.receiptUrl && (
                        <button
                          onClick={() => downloadReceipt(expense.receiptUrl, expense._id)}
                          className="inline-flex items-center p-2 border border-gray-300 rounded-full shadow-sm text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                        >
                          <Download className="h-4 w-4" />
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              </li>
            ))
          )}
        </ul>
      </div>

      {/* Detail Modal */}
      {showModal && selectedExpense && (
        <div className="fixed inset-0 z-50 overflow-y-auto">
          <div className="flex items-end justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
            <div className="fixed inset-0 transition-opacity" aria-hidden="true">
              <div className="absolute inset-0 bg-gray-500 opacity-75" onClick={() => setShowModal(false)}></div>
            </div>
            <div className="inline-block align-bottom bg-white rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-lg sm:w-full">
              <div className="bg-white px-4 pt-5 pb-4 sm:p-6 sm:pb-4">
                <div className="sm:flex sm:items-start">
                  <div className="mt-3 text-center sm:mt-0 sm:text-left w-full">
                    <h3 className="text-lg leading-6 font-medium text-gray-900">
                      Expense Details
                    </h3>
                    <div className="mt-4 space-y-4">
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <label className="block text-sm font-medium text-gray-500">Amount</label>
                          <p className="mt-1 text-sm text-gray-900">
                            {formatCurrency(selectedExpense.amount, selectedExpense.currency)}
                          </p>
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-500">Status</label>
                          <span className={`mt-1 ${getStatusBadge(selectedExpense.status)}`}>
                            {selectedExpense.status.replace("_", " ").replace(/\b\w/g, (l) => l.toUpperCase())}
                          </span>
                        </div>
                      </div>
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <label className="block text-sm font-medium text-gray-500">Category</label>
                          <p className="mt-1 text-sm text-gray-900 capitalize">
                            {selectedExpense.category?.replace("-", " ")}
                          </p>
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-500">Date</label>
                          <p className="mt-1 text-sm text-gray-900">
                            {formatDate(selectedExpense.date)}
                          </p>
                        </div>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-500">Description</label>
                        <p className="mt-1 text-sm text-gray-900">
                          {selectedExpense.description || "No description provided"}
                        </p>
                      </div>
                      {selectedExpense.receiptUrl && (
                        <div>
                          <label className="block text-sm font-medium text-gray-500">Receipt</label>
                          <button
                            onClick={() => downloadReceipt(selectedExpense.receiptUrl, selectedExpense._id)}
                            className="mt-1 inline-flex items-center px-3 py-2 border border-gray-300 shadow-sm text-sm leading-4 font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                          >
                            <Download className="h-4 w-4 mr-2" />
                            Download Receipt
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
              <div className="bg-gray-50 px-4 py-3 sm:px-6 sm:flex sm:flex-row-reverse">
                <button
                  type="button"
                  className="w-full inline-flex justify-center rounded-md border border-transparent shadow-sm px-4 py-2 bg-blue-600 text-base font-medium text-white hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 sm:ml-3 sm:w-auto sm:text-sm"
                  onClick={() => setShowModal(false)}
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}