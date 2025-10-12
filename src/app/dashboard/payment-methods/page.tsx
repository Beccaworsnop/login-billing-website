'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import DashboardLayout from "../../../../components/dash-layout";
import Link from "next/link";
import { useAuth } from '@/app/contexts/authContext';
import { paymentMethodsAPI, transactionsAPI } from '@/app/lib/api';

export default function PaymentMethodsPage() {
  const { isAuthenticated, isLoading } = useAuth();
  const router = useRouter();
  
  const [paymentMethods, setPaymentMethods] = useState<any[]>([]);
  const [stats, setStats] = useState({
    totalTransactions: 0,
    totalProcessed: 0,
    successRate: 0
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      router.push('/login');
    }
  }, [isAuthenticated, isLoading, router]);

  useEffect(() => {
    const fetchData = async () => {
      if (!isAuthenticated) return;

      try {
        setLoading(true);
        const methodsData = await paymentMethodsAPI.getAll();
        const statsData = await transactionsAPI.getStats();

        setPaymentMethods(methodsData.paymentMethods || []);

        const totalTx = statsData.statusBreakdown?.reduce((sum: number, item: any) => sum + (item._count?.status || 0), 0) || 0;
        const completed = statsData.statusBreakdown?.find((item: any) => item.status === 'completed')?._count?.status || 0;
        
        setStats({
          totalTransactions: totalTx,
          totalProcessed: statsData.monthlyStats?.totalSpent || 0,
          successRate: totalTx > 0 ? parseFloat(((completed / totalTx) * 100).toFixed(1)) : 0
        });
      } catch (error) {
        console.error('Failed to fetch payment methods:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [isAuthenticated]);

  const handleRemove = async (id: string) => {
    if (!confirm('Are you sure you want to remove this payment method?')) return;

    try {
      await paymentMethodsAPI.remove(id);
      setPaymentMethods(prev => prev.filter(m => m.id !== id));
    } catch (error) {
      console.error('Failed to remove payment method:', error);
      alert('Failed to remove payment method');
    }
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
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-foreground">Payment Methods</h1>
            <p className="text-muted-foreground mt-2">Manage your saved payment methods and billing information.</p>
          </div>
          <Link href="/dashboard/add-payment" className="bg-primary text-primary-foreground px-6 py-3 rounded-lg font-semibold hover:bg-primary/90 transition-colors">
            Add New Method
          </Link>
        </div>

        {paymentMethods.length > 0 ? (
          <div className="grid gap-6">
            {paymentMethods.map((method) => (
              <div key={method.id} className="bg-card/10 backdrop-blur-sm rounded-lg border border-border/20 p-6">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-4">
                    <div className="w-16 h-10 bg-primary/20 rounded-lg flex items-center justify-center">
                      <span className="text-sm font-bold text-primary">{method.type.slice(0, 4).toUpperCase()}</span>
                    </div>
                    <div>
                      <div className="flex items-center space-x-3">
                        <h3 className="text-lg font-semibold text-card-foreground">
                          {method.provider} •••• {method.last4Digits}
                        </h3>
                        <span className={`px-2 py-1 rounded text-xs font-medium ${method.isActive ? "bg-primary/20 text-primary" : "bg-destructive/20 text-destructive"}`}>
                          {method.isActive ? 'Active' : 'Inactive'}
                        </span>
                      </div>
                      <p className="text-sm text-muted-foreground">
                        Added {new Date(method.addedAt).toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center space-x-3">
                    <button 
                      onClick={() => handleRemove(method.id)}
                      className="text-destructive hover:text-destructive/80 text-sm font-medium"
                    >
                      Remove
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="bg-card/10 backdrop-blur-sm rounded-lg border border-border/20 p-12 text-center">
            <div className="w-16 h-16 bg-muted/20 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg className="w-8 h-8 text-muted-foreground" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
              </svg>
            </div>
            <h3 className="text-lg font-semibold text-card-foreground mb-2">No Payment Methods</h3>
            <p className="text-muted-foreground mb-6">Add your first payment method to start making transactions</p>
            <Link href="/dashboard/add-payment" className="inline-block bg-primary text-primary-foreground px-6 py-3 rounded-lg font-medium hover:bg-primary/90 transition-colors">
              Add Payment Method
            </Link>
          </div>
        )}

        <div className="bg-card/10 backdrop-blur-sm rounded-lg border border-border/20">
          <div className="p-6 border-b border-border/20">
            <h2 className="text-xl font-semibold text-card-foreground">Payment Statistics</h2>
          </div>
          <div className="p-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="text-center">
                <div className="w-16 h-16 bg-primary/20 rounded-full flex items-center justify-center mx-auto mb-3">
                  <svg className="w-8 h-8 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
                  </svg>
                </div>
                <p className="text-2xl font-bold text-card-foreground">{stats.totalTransactions}</p>
                <p className="text-sm text-muted-foreground">Total Transactions</p>
              </div>
              <div className="text-center">
                <div className="w-16 h-16 bg-primary/20 rounded-full flex items-center justify-center mx-auto mb-3">
                  <svg className="w-8 h-8 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1" />
                  </svg>
                </div>
                <p className="text-2xl font-bold text-card-foreground">${stats.totalProcessed.toFixed(2)}</p>
                <p className="text-sm text-muted-foreground">Total Processed</p>
              </div>
              <div className="text-center">
                <div className="w-16 h-16 bg-primary/20 rounded-full flex items-center justify-center mx-auto mb-3">
                  <svg className="w-8 h-8 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <p className="text-2xl font-bold text-card-foreground">{stats.successRate}%</p>
                <p className="text-sm text-muted-foreground">Success Rate</p>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-primary/10 rounded-lg p-6 border border-primary/20">
          <div className="flex items-start space-x-4">
            <div className="w-10 h-10 bg-primary/20 rounded-lg flex items-center justify-center">
              <svg className="w-5 h-5 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
              </svg>
            </div>
            <div>
              <h3 className="font-semibold text-primary mb-2">Your Payment Methods are Secure</h3>
              <p className="text-sm text-primary/80 leading-relaxed">
                All payment information is encrypted using bank-level security. We never store your full card details and comply with PCI DSS standards.
              </p>
            </div>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}