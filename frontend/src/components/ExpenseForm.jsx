import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useForm } from "react-hook-form";
import { Upload, Calendar, DollarSign } from "lucide-react";
import axios from "axios";

export default function ExpenseForm() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);
  const navigate = useNavigate();

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
  } = useForm();

  const onSubmit = async (data) => {
    setLoading(true);
    setError("");

    try {
      const formData = new FormData();
      formData.append("amount", data.amount);
      formData.append("currency", data.currency);
      formData.append("category", data.category);
      formData.append("description", data.description);
      formData.append("date", data.date);

      if (data.receipt[0]) {
        formData.append("receipt", data.receipt[0]);
      }

      await axios.post("/expenses", formData, {
        headers: {
          "Content-Type": "multipart/form-data",
        },
      });

      setSuccess(true);
      reset();
      setTimeout(() => {
        navigate("/dashboard");
      }, 2000);
    } catch (error) {
      setError(error.response?.data?.error || "Failed to submit expense");
    } finally {
      setLoading(false);
    }
  };

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

  const currencies = [
    "USD",
    "EUR",
    "GBP",
    "JPY",
    "CNY",
    "INR",
    "CAD",
    "AUD",
    "CHF",
    "SEK",
  ];

  if (success) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
        <div className="max-w-md w-full bg-white shadow-lg rounded-lg p-6 sm:p-8 text-center">
          <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-green-100">
            <svg
              className="h-6 w-6 text-green-600"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2"
                d="M5 13l4 4L19 7"
              ></path>
            </svg>
          </div>
          <h3 className="mt-4 text-lg font-medium text-gray-900">
            Expense Submitted!
          </h3>
          <p className="mt-2 text-sm text-gray-500">
            Your expense has been submitted for approval. Redirecting to
            dashboard...
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full max-w-4xl mx-auto">
      <div className="md:grid md:grid-cols-3 md:gap-6">
        <div className="md:col-span-1">
          <div className="px-0 sm:px-0">
            <h3 className="text-lg font-medium leading-6 text-gray-900">
              Submit Expense
            </h3>
            <p className="mt-1 text-sm text-gray-600">
              Fill out the form below to submit a new expense for approval.
            </p>
          </div>
        </div>
        <div className="mt-5 md:mt-0 md:col-span-2">
          <form onSubmit={handleSubmit(onSubmit)}>
            <div className="shadow sm:rounded-md sm:overflow-hidden">
              <div className="px-4 py-5 bg-white space-y-4 sm:space-y-6 sm:p-6">
                {error && (
                  <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded relative">
                    <span className="block sm:inline">{error}</span>
                  </div>
                )}

                <div className="grid grid-cols-6 gap-6">
                  <div className="col-span-6 sm:col-span-3">
                    <label
                      htmlFor="amount"
                      className="block text-sm font-medium text-gray-700"
                    >
                      Amount
                    </label>
                    <div className="mt-1 relative rounded-md shadow-sm">
                      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                        <DollarSign className="h-4 w-4 text-gray-400" />
                      </div>
                      <input
                        type="number"
                        step="0.01"
                        {...register("amount", {
                          required: "Amount is required",
                          min: {
                            value: 0.01,
                            message: "Amount must be greater than 0",
                          },
                        })}
                        className="focus:ring-blue-500 focus:border-blue-500 block w-full pl-10 sm:text-sm border-gray-300 rounded-md"
                        placeholder="0.00"
                      />
                    </div>
                    {errors.amount && (
                      <p className="mt-1 text-sm text-red-600">
                        {errors.amount.message}
                      </p>
                    )}
                  </div>

                  <div className="col-span-6 sm:col-span-3">
                    <label
                      htmlFor="currency"
                      className="block text-sm font-medium text-gray-700"
                    >
                      Currency
                    </label>
                    <select
                      {...register("currency", {
                        required: "Currency is required",
                      })}
                      className="mt-1 block w-full py-2 px-3 border border-gray-300 bg-white rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                    >
                      <option value="">Select currency</option>
                      {currencies.map((currency) => (
                        <option key={currency} value={currency}>
                          {currency}
                        </option>
                      ))}
                    </select>
                    {errors.currency && (
                      <p className="mt-1 text-sm text-red-600">
                        {errors.currency.message}
                      </p>
                    )}
                  </div>

                  <div className="col-span-6 sm:col-span-3">
                    <label
                      htmlFor="category"
                      className="block text-sm font-medium text-gray-700"
                    >
                      Category
                    </label>
                    <select
                      {...register("category", {
                        required: "Category is required",
                      })}
                      className="mt-1 block w-full py-2 px-3 border border-gray-300 bg-white rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                    >
                      <option value="">Select category</option>
                      {categories.map((category) => (
                        <option key={category} value={category}>
                          {category
                            .replace("-", " ")
                            .replace(/\b\w/g, (l) => l.toUpperCase())}
                        </option>
                      ))}
                    </select>
                    {errors.category && (
                      <p className="mt-1 text-sm text-red-600">
                        {errors.category.message}
                      </p>
                    )}
                  </div>

                  <div className="col-span-6 sm:col-span-3">
                    <label
                      htmlFor="date"
                      className="block text-sm font-medium text-gray-700"
                    >
                      Date
                    </label>
                    <div className="mt-1 relative rounded-md shadow-sm">
                      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                        <Calendar className="h-4 w-4 text-gray-400" />
                      </div>
                      <input
                        type="date"
                        {...register("date", { required: "Date is required" })}
                        className="focus:ring-blue-500 focus:border-blue-500 block w-full pl-10 sm:text-sm border-gray-300 rounded-md"
                      />
                    </div>
                    {errors.date && (
                      <p className="mt-1 text-sm text-red-600">
                        {errors.date.message}
                      </p>
                    )}
                  </div>

                  <div className="col-span-6">
                    <label
                      htmlFor="description"
                      className="block text-sm font-medium text-gray-700"
                    >
                      Description
                    </label>
                    <textarea
                      {...register("description")}
                      rows={3}
                      className="mt-1 shadow-sm focus:ring-blue-500 focus:border-blue-500 block w-full sm:text-sm border-gray-300 rounded-md"
                      placeholder="Brief description of the expense..."
                    />
                  </div>

                  <div className="col-span-6">
                    <label className="block text-sm font-medium text-gray-700">
                      Receipt
                    </label>
                    <div className="mt-1 flex justify-center px-6 pt-5 pb-6 border-2 border-gray-300 border-dashed rounded-md">
                      <div className="space-y-1 text-center">
                        <Upload className="mx-auto h-12 w-12 text-gray-400" />
                        <div className="flex text-sm text-gray-600">
                          <label
                            htmlFor="receipt"
                            className="relative cursor-pointer bg-white rounded-md font-medium text-blue-600 hover:text-blue-500 focus-within:outline-none focus-within:ring-2 focus-within:ring-offset-2 focus-within:ring-blue-500"
                          >
                            <span>Upload a file</span>
                            <input
                              id="receipt"
                              type="file"
                              accept="image/*,.pdf"
                              {...register("receipt")}
                              className="sr-only"
                            />
                          </label>
                          <p className="pl-1">or drag and drop</p>
                        </div>
                        <p className="text-xs text-gray-500">
                          PNG, JPG, PDF up to 10MB
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
              <div className="px-4 py-3 bg-gray-50 text-right sm:px-6">
                <button
                  type="button"
                  onClick={() => navigate("/dashboard")}
                  className="mr-3 inline-flex justify-center py-2 px-4 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="inline-flex justify-center py-2 px-4 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50"
                >
                  {loading ? "Submitting..." : "Submit Expense"}
                </button>
              </div>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
