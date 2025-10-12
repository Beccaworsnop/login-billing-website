'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import DashboardLayout from "../../../../components/dash-layout";
import { useAuth } from '@/app/contexts/authContext';
import { transactionsAPI } from '@/app/lib/api';

export default function HistoryPage() {
  const { isAuthenticated, isLoading } = useAuth();
  const router = useRouter();
  
  const [transactions, setTransactions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({
    dateRange: 'last_30_days',
    status: 'all',
    amount: 'any'
  });

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      router.push('/login');
    }
  }, [isAuthenticated, isLoading, router]);

  useEffect(() => {
    fetchTransactions();
  }, [isAuthenticated]);

  const fetchTransactions = async () => {
    if (!isAuthenticated) return;

    try {
      setLoading(true);
      const data = await transactionsAPI.getAll({ limit: 50 });
      setTransactions(data.transactions || []);
    } catch (error) {
      console.error('Failed to fetch transactions:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleFilterChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setFilters(prev => ({
      ...prev,
      [e.target.name]: e.target.value
    }));
  };

  const applyFilters = () => {
    let filtered = [...transactions];

    // Filter by status
    if (filters.status !== 'all') {
      filtered = filtered.filter(t => t.status.toLowerCase() === filters.status.toLowerCase());
    }

    // Filter by amount
    if (filters.amount !== 'any') {
      filtered = filtered.filter(t => {
        const amount = t.amount;
        if (filters.amount === '0-50') return amount >= 0 && amount <= 50;
        if (filters.amount === '50-200') return amount > 50 && amount <= 200;
        if (filters.amount === '200+') return amount > 200;
        return true;
      });
    }

    // Filter by date range
    if (filters.dateRange !== 'all_time') {
      const now = new Date();
      filtered = filtered.filter(t => {
        const txDate = new Date(t.createdAt);
        const diffDays = Math.floor((now.getTime() - txDate.getTime()) / (1000 * 60 * 60 * 24));
        
        if (filters.dateRange === 'last_30_days') return diffDays <= 30;
        if (filters.dateRange === 'last_90_days') return diffDays <= 90;
        if (filters.dateRange === 'last_year') return diffDays <= 365;
        return true;
      });
    }

    return filtered;
  };

  const filteredTransactions = applyFilters();

  const formatAmount = (amount: number) => {
    return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(amount);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', { 
      year: 'numeric', 
      month: 'short', 
      day: 'numeric' 
    });
  };

  const formatTime = (dateString: string) => {
    return new Date(dateString).toLocaleTimeString('en-US', { 
      hour: '2-digit', 
      minute: '2-digit' 
    });
  };

  if (isLoading || loading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center min-h-screen">
          <div className="w-16 h-16 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="space-y-8">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Transaction History</h1>
          <p className="text-muted-foreground mt-2">View all your payment transactions and their status.</p>
        </div>

        <div className="bg-card/10 backdrop-blur-sm p-6 rounded-lg border border-border/20">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div>
              <label className="block text-sm font-medium text-card-foreground mb-2">Date Range</label>
              <select 
                name="dateRange"
                value={filters.dateRange}
                onChange={handleFilterChange}
                className="w-full bg-input border border-border rounded-lg px-3 py-2 text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
              >
                <option value="last_30_days">Last 30 days</option>
                <option value="last_90_days">Last 90 days</option>
                <option value="last_year">Last year</option>
                <option value="all_time">All time</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-card-foreground mb-2">Status</label>
              <select 
                name="status"
                value={filters.status}
                onChange={handleFilterChange}
                className="w-full bg-input border border-border rounded-lg px-3 py-2 text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
              >
                <option value="all">All statuses</option>
                <option value="completed">Completed</option>
                <option value="pending">Pending</option>
                <option value="failed">Failed</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-card-foreground mb-2">Amount</label>
              <select 
                name="amount"
                value={filters.amount}
                onChange={handleFilterChange}
                className="w-full bg-input border border-border rounded-lg px-3 py-2 text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
              >
                <option value="any">Any amount</option>
                <option value="0-50">$0 - $50</option>
                <option value="50-200">$50 - $200</option>
                <option value="200+">$200+</option>
              </select>
            </div>
            <div className="flex items-end">
              <div className="w-full text-sm text-muted-foreground">
                Showing {filteredTransactions.length} of {transactions.length} transactions
              </div>
            </div>
          </div>
        </div>

        {filteredTransactions.length > 0 ? (
          <div className="bg-card/10 backdrop-blur-sm rounded-lg border border-border/20 overflow-hidden">
            <div className="p-6 border-b border-border/20">
              <h2 className="text-xl font-semibold text-card-foreground">All Transactions</h2>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-muted/10">
                  <tr>
                    <th className="text-left p-4 font-medium text-card-foreground">Transaction ID</th>
                    <th className="text-left p-4 font-medium text-card-foreground">Amount</th>
                    <th className="text-left p-4 font-medium text-card-foreground">Status</th>
                    <th className="text-left p-4 font-medium text-card-foreground">Date</th>
                    <th className="text-left p-4 font-medium text-card-foreground">Payment Method</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredTransactions.map((transaction) => (
                    <tr key={transaction.id} className="border-b border-border/10 hover:bg-muted/5">
                      <td className="p-4 text-card-foreground font-mono text-sm">{transaction.id.slice(0, 12)}...</td>
                      <td className="p-4 text-card-foreground font-semibold">{formatAmount(transaction.amount)}</td>
                      <td className="p-4">
                        <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                          transaction.status === "completed" ? "bg-primary/20 text-primary" :
                          transaction.status === "pending" ? "bg-yellow-500/20 text-yellow-500" :
                          "bg-destructive/20 text-destructive"
                        }`}>
                          {transaction.status.charAt(0).toUpperCase() + transaction.status.slice(1)}
                        </span>
                      </td>
                      <td className="p-4 text-muted-foreground">
                        <div className="text-card-foreground">{formatDate(transaction.createdAt)}</div>
                        <div className="text-sm">{formatTime(transaction.createdAt)}</div>
                      </td>
                      <td className="p-4">
                        <div className="flex items-center space-x-2">
                          <span className="text-card-foreground">
                            {transaction.paymentMethod?.provider || 'N/A'} •••• {transaction.paymentMethod?.last4Digits || '****'}
                          </span>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        ) : (
          <div className="bg-card/10 backdrop-blur-sm rounded-lg border border-border/20 p-12 text-center">
            <div className="w-16 h-16 bg-muted/20 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg className="w-8 h-8 text-muted-foreground" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <h3 className="text-lg font-semibold text-card-foreground mb-2">No Transactions Found</h3>
            <p className="text-muted-foreground">
              {transactions.length === 0 ? 'You haven\'t made any transactions yet' : 'No transactions match your filters'}
            </p>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}