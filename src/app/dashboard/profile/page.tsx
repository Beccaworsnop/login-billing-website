'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import DashboardLayout from "../../../../components/dash-layout";
import { useAuth } from '@/app/contexts/authContext'; 

export default function ProfilePage() {
  const { user, isAuthenticated, isLoading } = useAuth();
  const router = useRouter();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (mounted && !isLoading && !isAuthenticated) {
      router.push('/login');
    }
  }, [isAuthenticated, isLoading, router, mounted]);

  if (!mounted || isLoading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center min-h-screen">
          <div className="text-center">
            <div className="w-16 h-16 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
            <p className="text-muted-foreground">Loading profile...</p>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  if (!user) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center min-h-screen">
          <div className="text-center">
            <p className="text-muted-foreground">No user data available</p>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  // Extract initials from user name
  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map(n => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  // Format date
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
  };

  return (
    <DashboardLayout>
      <div className="space-y-8">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Profile</h1>
          <p className="text-muted-foreground mt-2">Manage your personal information and payment methods.</p>
        </div>

        <div className="bg-card/10 backdrop-blur-sm rounded-lg border border-border/20">
          <div className="p-6 border-b border-border/20">
            <h2 className="text-xl font-semibold text-card-foreground">Profile Information</h2>
          </div>
          <div className="p-6">
            <div className="flex items-center space-x-6 mb-8">
              <div className="w-24 h-24 bg-primary rounded-full flex items-center justify-center">
                <span className="text-3xl font-bold text-primary-foreground">
                  {getInitials(user.name || 'User')}
                </span>
              </div>
              <div>
                <h3 className="text-2xl font-bold text-card-foreground">{user.name || 'User'}</h3>
                <p className="text-muted-foreground">{user.email}</p>
                <p className="text-sm text-muted-foreground mt-1">
                  Member since {user.createdAt ? formatDate(user.createdAt) : 'Recently'}
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-card-foreground mb-1">Full Name</label>
                  <p className="text-foreground">{user.name || 'Not provided'}</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-card-foreground mb-1">Email</label>
                  <p className="text-foreground">{user.email}</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-card-foreground mb-1">Phone</label>
                  <p className="text-foreground">{user.phone || 'Not provided'}</p>
                </div>
              </div>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-card-foreground mb-1">Account Status</label>
                  <span className="px-3 py-1 bg-primary/20 text-primary rounded-full text-sm font-medium">
                    {user.verified ? 'Verified' : 'Pending Verification'}
                  </span>
                </div>
                <div>
                  <label className="block text-sm font-medium text-card-foreground mb-1">Account Type</label>
                  <p className="text-foreground">{user.accountType || 'Standard'}</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-card-foreground mb-1">User ID</label>
                  <p className="text-foreground text-xs font-mono">{user.id || user._id || 'N/A'}</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-card/10 backdrop-blur-sm rounded-lg border border-border/20">
          <div className="p-6 border-b border-border/20 flex items-center justify-between">
            <h2 className="text-xl font-semibold text-card-foreground">Payment Methods</h2>
            <button className="bg-primary text-primary-foreground px-4 py-2 rounded-lg font-medium hover:bg-primary/90 transition-colors">
              Add New Card
            </button>
          </div>
          <div className="p-6">
            {user.paymentMethods && user.paymentMethods.length > 0 ? (
              <div className="space-y-4">
                {user.paymentMethods.map((card: any, index: number) => (
                  <div key={index} className="flex items-center justify-between p-4 bg-muted/10 rounded-lg">
                    <div className="flex items-center space-x-4">
                      <div className="w-12 h-8 bg-primary/20 rounded flex items-center justify-center">
                        <span className="text-xs font-bold text-primary">{card.type?.slice(0, 4)}</span>
                      </div>
                      <div>
                        <p className="font-medium text-card-foreground">
                          {card.type} ending in {card.last4}
                        </p>
                        <p className="text-sm text-muted-foreground">Expires {card.expiry}</p>
                      </div>
                      {card.isDefault && (
                        <span className="px-2 py-1 bg-primary/20 text-primary rounded text-xs font-medium">Default</span>
                      )}
                    </div>
                    <div className="flex items-center space-x-2">
                      <button className="text-primary hover:text-primary/80 text-sm font-medium">Edit</button>
                      <button className="text-destructive hover:text-destructive/80 text-sm font-medium">Remove</button>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8">
                <p className="text-muted-foreground mb-4">No payment methods added yet</p>
                <button className="bg-primary text-primary-foreground px-6 py-2 rounded-lg font-medium hover:bg-primary/90 transition-colors">
                  Add Your First Card
                </button>
              </div>
            )}
          </div>
        </div>

        <div className="bg-card/10 backdrop-blur-sm rounded-lg border border-border/20">
          <div className="p-6 border-b border-border/20">
            <h2 className="text-xl font-semibold text-card-foreground">Account Statistics</h2>
          </div>
          <div className="p-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="text-center">
                <p className="text-3xl font-bold text-primary">{user.stats?.totalTransactions || 0}</p>
                <p className="text-sm text-muted-foreground">Total Transactions</p>
              </div>
              <div className="text-center">
                <p className="text-3xl font-bold text-primary">
                  ${user.stats?.totalAmount?.toLocaleString() || '0'}
                </p>
                <p className="text-sm text-muted-foreground">Total Amount Processed</p>
              </div>
              <div className="text-center">
                <p className="text-3xl font-bold text-primary">
                  {user.stats?.successRate || '100'}%
                </p>
                <p className="text-sm text-muted-foreground">Success Rate</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}