'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import DashboardLayout from "../../../../components/dash-layout";
import { useAuth } from '@/app/contexts/authContext';
import { transactionsAPI } from '@/app/lib/api';

export default function ActivityLogPage() {
  const { isAuthenticated, isLoading } = useAuth();
  const router = useRouter();
  
  const [activities, setActivities] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({
    type: 'all',
    dateRange: 'last_7_days',
    status: 'all'
  });

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      router.push('/login');
    }
  }, [isAuthenticated, isLoading, router]);

  useEffect(() => {
    fetchActivities();
  }, [isAuthenticated]);

  const fetchActivities = async () => {
    if (!isAuthenticated) return;

    try {
      setLoading(true);
      // Fetch transactions as activity
      const transactionsData = await transactionsAPI.getAll({ limit: 50 });
      
      // Convert transactions to activity format
      const activityList = (transactionsData.transactions || []).map((tx: any) => ({
        id: tx.id,
        type: tx.status === 'completed' ? 'payment' : tx.status === 'failed' ? 'payment_failed' : 'payment_pending',
        description: `Transaction ${tx.status} - $${tx.amount}`,
        timestamp: tx.createdAt,
        ip: 'N/A',
        device: 'Web Browser',
        status: tx.status,
        amount: tx.amount
      }));

      setActivities(activityList);
    } catch (error) {
      console.error('Failed to fetch activities:', error);
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
    let filtered = [...activities];

    if (filters.type !== 'all') {
      if (filters.type === 'login') {
        filtered = filtered.filter(a => a.type === 'login');
      } else if (filters.type === 'payment') {
        filtered = filtered.filter(a => a.type.includes('payment'));
      }
    }

    if (filters.status !== 'all') {
      filtered = filtered.filter(a => a.status === filters.status);
    }

    if (filters.dateRange !== 'all') {
      const now = new Date();
      filtered = filtered.filter(a => {
        const actDate = new Date(a.timestamp);
        const diffDays = Math.floor((now.getTime() - actDate.getTime()) / (1000 * 60 * 60 * 24));
        
        if (filters.dateRange === 'last_7_days') return diffDays <= 7;
        if (filters.dateRange === 'last_30_days') return diffDays <= 30;
        if (filters.dateRange === 'last_90_days') return diffDays <= 90;
        return true;
      });
    }

    return filtered;
  };

  const filteredActivities = applyFilters();

  const getActivityIcon = (type: string) => {
    switch (type) {
      case "login":
        return (
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 16l-4-4m0 0l4-4m-4 4h14m-5 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h7a3 3 0 013 3v1" />
          </svg>
        );
      case "payment":
      case "payment_pending":
        return (
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
          </svg>
        );
      case "payment_failed":
        return (
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
          </svg>
        );
      default:
        return (
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        );
    }
  };

  const formatTimestamp = (timestamp: string) => {
    return new Date(timestamp).toLocaleString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
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
          <h1 className="text-3xl font-bold text-foreground">Activity Log</h1>
          <p className="text-muted-foreground mt-2">Monitor all account activity and security events.</p>
        </div>

        <div className="bg-card/10 backdrop-blur-sm p-6 rounded-lg border border-border/20">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div>
              <label className="block text-sm font-medium text-card-foreground mb-2">Activity Type</label>
              <select 
                name="type"
                value={filters.type}
                onChange={handleFilterChange}
                className="w-full bg-input border border-border rounded-lg px-3 py-2 text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
              >
                <option value="all">All activities</option>
                <option value="login">Login events</option>
                <option value="payment">Payment activities</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-card-foreground mb-2">Date Range</label>
              <select 
                name="dateRange"
                value={filters.dateRange}
                onChange={handleFilterChange}
                className="w-full bg-input border border-border rounded-lg px-3 py-2 text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
              >
                <option value="last_7_days">Last 7 days</option>
                <option value="last_30_days">Last 30 days</option>
                <option value="last_90_days">Last 90 days</option>
                <option value="all">All time</option>
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
                <option value="completed">Success</option>
                <option value="failed">Failed</option>
                <option value="pending">Pending</option>
              </select>
            </div>
            <div className="flex items-end">
              <div className="w-full text-sm text-muted-foreground">
                {filteredActivities.length} activities found
              </div>
            </div>
          </div>
        </div>

        {filteredActivities.length > 0 ? (
          <div className="bg-card/10 backdrop-blur-sm rounded-lg border border-border/20">
            <div className="p-6 border-b border-border/20">
              <h2 className="text-xl font-semibold text-card-foreground">Recent Activity</h2>
            </div>
            <div className="divide-y divide-border/20">
              {filteredActivities.map((activity) => (
                <div key={activity.id} className="p-6 hover:bg-muted/5 transition-colors">
                  <div className="flex items-start space-x-4">
                    <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${
                      activity.status === "completed" ? "bg-primary/20 text-primary" :
                      activity.status === "failed" ? "bg-destructive/20 text-destructive" :
                      "bg-muted/20 text-muted-foreground"
                    }`}>
                      {getActivityIcon(activity.type)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between">
                        <p className="font-medium text-card-foreground">{activity.description}</p>
                        <span className={`px-2 py-1 rounded text-xs font-medium ${
                          activity.status === "completed" ? "bg-primary/20 text-primary" :
                          activity.status === "failed" ? "bg-destructive/20 text-destructive" :
                          "bg-muted/20 text-muted-foreground"
                        }`}>
                          {activity.status}
                        </span>
                      </div>
                      <div className="mt-1 text-sm text-muted-foreground">
                        <p>{formatTimestamp(activity.timestamp)}</p>
                        <p>IP: {activity.ip} • {activity.device}</p>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        ) : (
          <div className="bg-card/10 backdrop-blur-sm rounded-lg border border-border/20 p-12 text-center">
            <div className="w-16 h-16 bg-muted/20 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg className="w-8 h-8 text-muted-foreground" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
              </svg>
            </div>
            <h3 className="text-lg font-semibold text-card-foreground mb-2">No Activity Found</h3>
            <p className="text-muted-foreground">No activities match your selected filters</p>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}