import React, { Component, useEffect, type ReactNode } from 'react';
import { Sidebar } from './components/layout/Sidebar';
import { TopHeader } from './components/layout/TopHeader';
import { POSTerminal } from './components/pos/POSTerminal';
import { DashboardView } from './components/dashboard/DashboardView';
import { ProductsView } from './components/products/ProductsView';
import { TransactionsView } from './components/transactions/TransactionsView';
import { ExpensesView } from './components/expenses/ExpensesView';
import { CashClosingView } from './components/register/CashClosingView';
import { ReportsView } from './components/reports/ReportsView';
import { SettingsView } from './components/settings/SettingsView';
import { OrderBookersView } from './components/bookers/OrderBookersView';
import { OrderBookingView } from './components/bookers/OrderBookingView';

import { PaymentModal } from './components/modals/PaymentModal';
import { SaleSuccessModal } from './components/modals/SaleSuccessModal';
import { ReceiptPreviewModal } from './components/modals/ReceiptPreviewModal';
import { VariationSelectorModal } from './components/modals/VariationSelectorModal';
import { ProductFormModal } from './components/modals/ProductFormModal';
import { OpeningCashModal } from './components/modals/OpeningCashModal';
import { CashMovementModal } from './components/modals/CashMovementModal';
import { TransactionDetailsModal } from './components/modals/TransactionDetailsModal';

import { useUIStore } from './store/useUIStore';
import { useShiftStore } from './store/useShiftStore';

interface ErrorBoundaryProps {
  children: ReactNode;
  viewName: string;
}

interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
}

class ViewErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error(`[ViewErrorBoundary] Error in view "${this.props.viewName}":`, error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="p-8 bg-rose-50 border border-rose-200 rounded-2xl text-rose-800 space-y-4">
          <div className="flex items-center gap-2">
            <span className="text-xl">⚠️</span>
            <h2 className="text-lg font-bold">Error rendering {this.props.viewName}</h2>
          </div>
          <p className="text-xs font-mono bg-white p-4 rounded-xl border border-rose-200 overflow-auto text-rose-900">
            {this.state.error?.message || 'Unknown error occurred'}
          </p>
          <button
            onClick={() => this.setState({ hasError: false, error: null })}
            className="px-4 py-2 bg-[#3FA9A8] text-white rounded-xl text-xs font-bold hover:bg-[#349695] transition cursor-pointer"
          >
            Retry View
          </button>
        </div>
      );
    }
    return this.props.children;
  }
}

export function App() {
  const { activeTab } = useUIStore();

  useEffect(() => {
    useShiftStore.getState().initShift();
  }, []);

  const renderActiveView = () => {
    switch (activeTab) {
      case 'pos':
        return <POSTerminal />;
      case 'dashboard':
        return <DashboardView />;
      case 'products':
        return <ProductsView />;
      case 'transactions':
        return <TransactionsView />;
      case 'expenses':
        return <ExpensesView />;
      case 'cash_closing':
        return <CashClosingView />;
      case 'order_bookers':
        return <OrderBookersView />;
      case 'order_booking':
        return <OrderBookingView />;
      case 'reports':
        return <ReportsView />;
      case 'settings':
        return <SettingsView />;
      default:
        return <POSTerminal />;
    }
  };

  return (
    <div className="h-full w-full flex overflow-hidden text-slate-800 antialiased selection:bg-teal-100 selection:text-teal-800 bg-[#F7F8FA]">
      {/* BEGIN: Left Sidebar */}
      <Sidebar />

      {/* BEGIN: Main Content Area */}
      <div className="flex-1 flex flex-col h-full overflow-hidden">
        {/* Top Header Bar */}
        <TopHeader />

        {/* Scrollable Body Workspace */}
        <main className="flex-1 overflow-y-auto px-8 pb-8 pt-6">
          <ViewErrorBoundary key={activeTab} viewName={activeTab}>
            {renderActiveView()}
          </ViewErrorBoundary>
        </main>
      </div>

      {/* Global Interactive Modals & Dialogs (100% Stitch Parity) */}
      <PaymentModal />
      <SaleSuccessModal />
      <ReceiptPreviewModal />
      <VariationSelectorModal />
      <ProductFormModal />
      <OpeningCashModal />
      <CashMovementModal />
      <TransactionDetailsModal />
    </div>
  );
}

export default App;
