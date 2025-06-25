"use client";

import { useState, useEffect } from "react";
import {
  CreditCardIcon,
  CogIcon,
  BanknotesIcon,
  ChartBarIcon,
  BuildingLibraryIcon,
  ExclamationTriangleIcon,
  CheckCircleIcon,
  XCircleIcon,
  ClockIcon,
} from "@heroicons/react/24/outline";
import { DataTable, StatusBadge, LoadingSpinner } from "@/components/shared";
import PaymentGatewayModal from "@/components/PaymentGatewayModal";
import PaymentMethodModal from "@/components/PaymentMethodModal";
import TransactionModal from "@/components/TransactionModal";
import BankDetailsModal from "@/components/BankDetailsModal";
import ConfirmationModal from "@/components/ConfirmationModal";
import {
  fetchPaymentStatistics,
  fetchPaymentGateways,
  fetchPaymentMethods,
  fetchPaymentTransactions,
  fetchBankTransferDetails,
  deletePaymentGateway,
  deletePaymentMethod,
  deleteBankTransferDetails,
  PaymentStats,
  PaymentGateway,
  PaymentMethod,
  PaymentTransaction,
  BankTransferDetails,
} from "@/lib/api/payments";

type ActiveTab =
  | "overview"
  | "gateways"
  | "methods"
  | "transactions"
  | "bank-details";

export default function PaymentsPage() {
  const [activeTab, setActiveTab] = useState<ActiveTab>("overview");
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState<PaymentStats | null>(null);

  // Data states
  const [gateways, setGateways] = useState<PaymentGateway[]>([]);
  const [methods, setMethods] = useState<PaymentMethod[]>([]);
  const [transactions, setTransactions] = useState<PaymentTransaction[]>([]);
  const [bankDetails, setBankDetails] = useState<BankTransferDetails[]>([]);

  // Modal states
  const [gatewayModal, setGatewayModal] = useState<{
    isOpen: boolean;
    gateway?: PaymentGateway;
  }>({ isOpen: false });
  const [methodModal, setMethodModal] = useState<{
    isOpen: boolean;
    method?: PaymentMethod;
  }>({ isOpen: false });
  const [transactionModal, setTransactionModal] = useState<{
    isOpen: boolean;
    transaction?: PaymentTransaction;
  }>({ isOpen: false });
  const [bankModal, setBankModal] = useState<{
    isOpen: boolean;
    bankDetails?: BankTransferDetails;
  }>({ isOpen: false });

  // Delete confirmation modal state
  const [deleteModal, setDeleteModal] = useState<{
    isOpen: boolean;
    type: "gateway" | "method" | "bank" | null;
    item: any;
    isLoading: boolean;
    error: string | null;
  }>({
    isOpen: false,
    type: null,
    item: null,
    isLoading: false,
    error: null,
  });

  useEffect(() => {
    loadInitialData();
  }, []);

  const loadInitialData = async () => {
    try {
      setLoading(true);

      // Load statistics and overview data
      const [statsData, gatewaysData, methodsData, transactionsData, bankData] =
        await Promise.all([
          fetchPaymentStatistics(),
          fetchPaymentGateways({ limit: 10 }),
          fetchPaymentMethods({ limit: 10 }),
          fetchPaymentTransactions({ limit: 10 }),
          fetchBankTransferDetails({ limit: 10 }),
        ]);

      setStats(statsData);
      setGateways(gatewaysData.gateways);
      setMethods(methodsData.methods);
      setTransactions(transactionsData.transactions);
      setBankDetails(bankData.bank_details);
    } catch (error) {
      console.error("Error loading payment data:", error);
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "EUR",
    }).format(amount);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "completed":
        return <CheckCircleIcon className="h-5 w-5 text-green-500" />;
      case "failed":
        return <XCircleIcon className="h-5 w-5 text-red-500" />;
      case "pending":
        return <ClockIcon className="h-5 w-5 text-yellow-500" />;
      default:
        return <ExclamationTriangleIcon className="h-5 w-5 text-gray-500" />;
    }
  };

  const getGatewayTypeColor = (type: string) => {
    const colors = {
      stripe: "bg-purple-100 text-purple-800",
      paypal: "bg-blue-100 text-blue-800",
      bank_transfer: "bg-green-100 text-green-800",
      adyen: "bg-orange-100 text-orange-800",
    };
    return colors[type as keyof typeof colors] || "bg-gray-100 text-gray-800";
  };

  // Delete handlers
  const handleDeleteClick = (
    type: "gateway" | "method" | "bank",
    item: any
  ) => {
    setDeleteModal({
      isOpen: true,
      type,
      item,
      isLoading: false,
      error: null,
    });
  };

  const handleDeleteConfirm = async () => {
    if (!deleteModal.item || !deleteModal.type) return;

    setDeleteModal((prev) => ({ ...prev, isLoading: true, error: null }));

    try {
      switch (deleteModal.type) {
        case "gateway":
          await deletePaymentGateway(deleteModal.item.id);
          setGateways((prev) =>
            prev.filter((g) => g.id !== deleteModal.item.id)
          );
          break;
        case "method":
          await deletePaymentMethod(deleteModal.item.id);
          setMethods((prev) =>
            prev.filter((m) => m.id !== deleteModal.item.id)
          );
          break;
        case "bank":
          await deleteBankTransferDetails(deleteModal.item.id);
          setBankDetails((prev) =>
            prev.filter((b) => b.id !== deleteModal.item.id)
          );
          break;
      }

      // Close modal on success
      setDeleteModal({
        isOpen: false,
        type: null,
        item: null,
        isLoading: false,
        error: null,
      });
    } catch (error) {
      setDeleteModal((prev) => ({
        ...prev,
        isLoading: false,
        error: error instanceof Error ? error.message : "Failed to delete item",
      }));
    }
  };

  const handleDeleteCancel = () => {
    setDeleteModal({
      isOpen: false,
      type: null,
      item: null,
      isLoading: false,
      error: null,
    });
  };

  const getDeleteModalContent = () => {
    if (!deleteModal.item || !deleteModal.type)
      return { title: "", message: "" };

    const typeNames = {
      gateway: "Payment Gateway",
      method: "Payment Method",
      bank: "Bank Account",
    };

    const itemName =
      deleteModal.item.name || deleteModal.item.bank_name || "item";

    return {
      title: `Delete ${typeNames[deleteModal.type]}`,
      message: `Are you sure you want to delete "${itemName}"? This action cannot be undone.`,
    };
  };

  const tabs = [
    { id: "overview", name: "Overview", icon: ChartBarIcon },
    { id: "gateways", name: "Gateways", icon: CogIcon },
    { id: "methods", name: "Payment Methods", icon: CreditCardIcon },
    { id: "transactions", name: "Transactions", icon: BanknotesIcon },
    { id: "bank-details", name: "Bank Details", icon: BuildingLibraryIcon },
  ];

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Payment Management</h1>
        <p className="text-gray-600 mt-2">
          Manage payment gateways, methods, transactions, and bank details
        </p>
      </div>

      {/* Statistics Cards */}
      {stats && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <div className="bg-white rounded-lg shadow-md p-6">
            <div className="flex items-center">
              <div className="p-3 rounded-full bg-blue-100 text-blue-600">
                <BanknotesIcon className="h-6 w-6" />
              </div>
              <div className="ml-4">
                <h2 className="text-lg font-semibold text-gray-600">
                  Total Transactions
                </h2>
                <p className="text-3xl font-bold text-gray-900">
                  {stats.total_transactions}
                </p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-md p-6">
            <div className="flex items-center">
              <div className="p-3 rounded-full bg-green-100 text-green-600">
                <CheckCircleIcon className="h-6 w-6" />
              </div>
              <div className="ml-4">
                <h2 className="text-lg font-semibold text-gray-600">
                  Success Rate
                </h2>
                <p className="text-3xl font-bold text-gray-900">
                  {stats.success_rate}%
                </p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-md p-6">
            <div className="flex items-center">
              <div className="p-3 rounded-full bg-purple-100 text-purple-600">
                <ChartBarIcon className="h-6 w-6" />
              </div>
              <div className="ml-4">
                <h2 className="text-lg font-semibold text-gray-600">
                  Total Revenue
                </h2>
                <p className="text-3xl font-bold text-gray-900">
                  {formatCurrency(stats.completed_amount)}
                </p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-md p-6">
            <div className="flex items-center">
              <div className="p-3 rounded-full bg-yellow-100 text-yellow-600">
                <ClockIcon className="h-6 w-6" />
              </div>
              <div className="ml-4">
                <h2 className="text-lg font-semibold text-gray-600">Pending</h2>
                <p className="text-3xl font-bold text-gray-900">
                  {stats.pending_transactions}
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Tab Navigation */}
      <div className="border-b border-gray-200">
        <nav className="-mb-px flex space-x-8">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as ActiveTab)}
                className={`flex items-center py-2 px-1 border-b-2 font-medium text-sm ${
                  activeTab === tab.id
                    ? "border-green-500 text-green-600"
                    : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
                }`}
              >
                <Icon className="h-5 w-5 mr-2" />
                {tab.name}
              </button>
            );
          })}
        </nav>
      </div>

      {/* Tab Content */}
      <div className="bg-white rounded-lg shadow-md">
        {activeTab === "overview" && (
          <div className="p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-6">
              System Overview
            </h2>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Active Gateways */}
              <div>
                <h3 className="text-lg font-medium text-gray-900 mb-4">
                  Payment Gateways
                </h3>
                <div className="space-y-3">
                  {gateways.slice(0, 3).map((gateway) => (
                    <div
                      key={gateway.id}
                      className="flex items-center justify-between p-3 border rounded-lg"
                    >
                      <div className="flex items-center">
                        <span
                          className={`px-2 py-1 rounded-full text-xs font-medium ${getGatewayTypeColor(
                            gateway.type
                          )}`}
                        >
                          {gateway.type.toUpperCase()}
                        </span>
                        <span className="ml-3 font-medium text-gray-900">
                          {gateway.name}
                        </span>
                      </div>
                      <StatusBadge
                        status={gateway.is_active ? "active" : "inactive"}
                        variant={gateway.is_active ? "success" : "neutral"}
                      />
                    </div>
                  ))}
                </div>
              </div>

              {/* Recent Transactions */}
              <div>
                <h3 className="text-lg font-medium text-gray-900 mb-4">
                  Recent Transactions
                </h3>
                <div className="space-y-3">
                  {transactions.length > 0 ? (
                    transactions.slice(0, 3).map((transaction) => (
                      <div
                        key={transaction.id}
                        className="flex items-center justify-between p-3 border rounded-lg"
                      >
                        <div className="flex items-center">
                          {getStatusIcon(transaction.status)}
                          <div className="ml-3">
                            <p className="font-medium text-gray-900">
                              {formatCurrency(transaction.amount)}
                            </p>
                            <p className="text-sm text-gray-500">
                              {formatDate(transaction.created_at)}
                            </p>
                          </div>
                        </div>
                        <StatusBadge
                          status={transaction.status}
                          variant={
                            transaction.status === "completed"
                              ? "success"
                              : transaction.status === "failed"
                              ? "error"
                              : transaction.status === "pending"
                              ? "warning"
                              : "neutral"
                          }
                        />
                      </div>
                    ))
                  ) : (
                    <div className="text-center py-8 text-gray-500">
                      <p className="text-sm">No transactions yet</p>
                      <p className="text-xs mt-1">
                        Transactions will appear here once payments are
                        processed
                      </p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}

        {activeTab === "gateways" && (
          <div className="p-6">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-xl font-semibold text-gray-900">
                Payment Gateways
              </h2>
              <button
                onClick={() => setGatewayModal({ isOpen: true })}
                className="bg-green-600 text-white px-4 py-2 rounded-md hover:bg-green-700 transition-colors"
              >
                Add Gateway
              </button>
            </div>

            <DataTable
              data={gateways}
              columns={[
                { key: "name", label: "Name" },
                {
                  key: "type",
                  label: "Type",
                  render: (item, value) => (
                    <span
                      className={`px-2 py-1 rounded-full text-xs font-medium ${getGatewayTypeColor(
                        value
                      )}`}
                    >
                      {String(value || "").toUpperCase()}
                    </span>
                  ),
                },
                {
                  key: "is_live",
                  label: "Mode",
                  render: (item, value) => (
                    <StatusBadge
                      status={value ? "live" : "test"}
                      variant={value ? "success" : "warning"}
                    />
                  ),
                },
                {
                  key: "is_active",
                  label: "Status",
                  render: (item, value) => (
                    <StatusBadge
                      status={value ? "active" : "inactive"}
                      variant={value ? "success" : "neutral"}
                    />
                  ),
                },
                {
                  key: "created_at",
                  label: "Created",
                  render: (item, value) => formatDate(value),
                },
              ]}
              actions={[
                {
                  type: "edit",
                  label: "Edit",
                  onClick: (item) =>
                    setGatewayModal({ isOpen: true, gateway: item }),
                },
                {
                  type: "custom",
                  label: "Configure",
                  onClick: (item) => console.log("Configure gateway", item),
                },
                {
                  type: "delete",
                  label: "Delete",
                  onClick: (item) => handleDeleteClick("gateway", item),
                },
              ]}
            />
          </div>
        )}

        {activeTab === "methods" && (
          <div className="p-6">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-xl font-semibold text-gray-900">
                Payment Methods
              </h2>
              <button
                onClick={() => setMethodModal({ isOpen: true })}
                className="bg-green-600 text-white px-4 py-2 rounded-md hover:bg-green-700 transition-colors"
              >
                Add Method
              </button>
            </div>

            <DataTable
              data={methods}
              columns={[
                { key: "name", label: "Name" },
                { key: "type", label: "Type" },
                { key: "gateway.name", label: "Gateway" },
                {
                  key: "fee_percentage",
                  label: "Fee %",
                  render: (item, value) => `${Number(value || 0)}%`,
                },
                {
                  key: "fee_fixed",
                  label: "Fixed Fee",
                  render: (item, value) => formatCurrency(Number(value || 0)),
                },
                {
                  key: "is_active",
                  label: "Status",
                  render: (item, value) => (
                    <StatusBadge
                      status={value ? "active" : "inactive"}
                      variant={value ? "success" : "neutral"}
                    />
                  ),
                },
              ]}
              actions={[
                {
                  type: "edit",
                  label: "Edit",
                  onClick: (item) =>
                    setMethodModal({ isOpen: true, method: item }),
                },
                {
                  type: "delete",
                  label: "Delete",
                  onClick: (item) => handleDeleteClick("method", item),
                },
              ]}
            />
          </div>
        )}

        {activeTab === "transactions" && (
          <div className="p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-6">
              Payment Transactions
            </h2>

            <DataTable
              data={transactions}
              columns={[
                { key: "id", label: "ID" },
                {
                  key: "amount",
                  label: "Amount",
                  render: (item, value) => formatCurrency(value),
                },
                {
                  key: "status",
                  label: "Status",
                  render: (item, value) => (
                    <StatusBadge
                      status={value}
                      variant={
                        value === "completed"
                          ? "success"
                          : value === "failed"
                          ? "error"
                          : value === "pending"
                          ? "warning"
                          : "neutral"
                      }
                    />
                  ),
                },
                { key: "gateway.name", label: "Gateway" },
                { key: "payment_method.name", label: "Method" },
                {
                  key: "created_at",
                  label: "Created",
                  render: (item, value) => formatDate(value),
                },
              ]}
              actions={[
                {
                  type: "view",
                  label: "View",
                  onClick: (item) =>
                    setTransactionModal({ isOpen: true, transaction: item }),
                },
                {
                  type: "edit",
                  label: "Update",
                  onClick: (item) =>
                    setTransactionModal({ isOpen: true, transaction: item }),
                },
              ]}
            />
          </div>
        )}

        {activeTab === "bank-details" && (
          <div className="p-6">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-xl font-semibold text-gray-900">
                Bank Transfer Details
              </h2>
              <button
                onClick={() => setBankModal({ isOpen: true })}
                className="bg-green-600 text-white px-4 py-2 rounded-md hover:bg-green-700 transition-colors"
              >
                Add Bank Account
              </button>
            </div>

            <DataTable
              data={bankDetails}
              columns={[
                { key: "bank_name", label: "Bank" },
                { key: "account_name", label: "Account Name" },
                { key: "currency", label: "Currency" },
                { key: "country", label: "Country" },
                {
                  key: "is_primary",
                  label: "Primary",
                  render: (item, value) => (
                    <StatusBadge
                      status={value ? "primary" : "secondary"}
                      variant={value ? "success" : "neutral"}
                    />
                  ),
                },
                {
                  key: "is_active",
                  label: "Status",
                  render: (item, value) => (
                    <StatusBadge
                      status={value ? "active" : "inactive"}
                      variant={value ? "success" : "neutral"}
                    />
                  ),
                },
              ]}
              actions={[
                {
                  type: "edit",
                  label: "Edit",
                  onClick: (item) =>
                    setBankModal({ isOpen: true, bankDetails: item }),
                },
                {
                  type: "delete",
                  label: "Delete",
                  onClick: (item) => handleDeleteClick("bank", item),
                },
              ]}
            />
          </div>
        )}
      </div>

      {/* Modals */}
      <PaymentGatewayModal
        isOpen={gatewayModal.isOpen}
        onClose={() => setGatewayModal({ isOpen: false })}
        onSuccess={() => {
          loadInitialData();
          setGatewayModal({ isOpen: false });
        }}
        gateway={gatewayModal.gateway}
      />

      <PaymentMethodModal
        isOpen={methodModal.isOpen}
        onClose={() => setMethodModal({ isOpen: false })}
        onSuccess={() => {
          loadInitialData();
          setMethodModal({ isOpen: false });
        }}
        method={methodModal.method}
      />

      <TransactionModal
        isOpen={transactionModal.isOpen}
        onClose={() => setTransactionModal({ isOpen: false })}
        onSuccess={() => {
          loadInitialData();
          setTransactionModal({ isOpen: false });
        }}
        transaction={transactionModal.transaction}
      />

      <BankDetailsModal
        isOpen={bankModal.isOpen}
        onClose={() => setBankModal({ isOpen: false })}
        onSuccess={() => {
          loadInitialData();
          setBankModal({ isOpen: false });
        }}
        bankDetails={bankModal.bankDetails}
      />

      <ConfirmationModal
        isOpen={deleteModal.isOpen}
        onClose={handleDeleteCancel}
        onConfirm={handleDeleteConfirm}
        title={getDeleteModalContent().title}
        message={getDeleteModalContent().message}
        confirmText="Delete"
        cancelText="Cancel"
        confirmButtonColor="red"
        isLoading={deleteModal.isLoading}
        error={deleteModal.error}
      />
    </div>
  );
}
