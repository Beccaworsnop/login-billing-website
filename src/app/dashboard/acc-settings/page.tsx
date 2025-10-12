'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import DashboardLayout from "../../../../components/dash-layout";
import { useAuth } from '@/app/contexts/authContext';
import { settingsAPI, transactionsAPI, paymentMethodsAPI } from '@/app/lib/api';

export default function AccountSettingsPage() {
  const { isAuthenticated, isLoading } = useAuth();
  const router = useRouter();
  
  const [settings, setSettings] = useState<any>(null);
  const [stats, setStats] = useState({
    dailySpent: 0,
    monthlySpent: 0,
    activePaymentMethods: 0
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState('');

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      router.push('/login');
    }
  }, [isAuthenticated, isLoading, router]);

  useEffect(() => {
    fetchData();
  }, [isAuthenticated]);

  const fetchData = async () => {
    if (!isAuthenticated) return;

    try {
      setLoading(true);
      const [settingsData, statsData, methodsData] = await Promise.all([
        settingsAPI.get(),
        transactionsAPI.getStats(),
        paymentMethodsAPI.getAll()
      ]);

      setSettings(settingsData.settings);
      setStats({
        dailySpent: statsData.monthlyStats?.totalSpent || 0,
        monthlySpent: statsData.monthlyStats?.totalSpent || 0,
        activePaymentMethods: methodsData.paymentMethods?.filter((m: any) => m.isActive).length || 0
      });
    } catch (error) {
      console.error('Failed to fetch settings:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleLimitChange = (field: string, value: number) => {
    setSettings((prev: any) => ({
      ...prev,
      [field]: value
    }));
  };

  const handleSave = async () => {
    setSaving(true);
    setMessage('');

    try {
      await settingsAPI.updateLimits({
        dailyLimit: settings.dailyLimit,
        monthlyLimit: settings.monthlyLimit,
        maxSingleTransaction: settings.maxSingleTransaction,
        paymentMethodLimit: settings.paymentMethodLimit
      });
      
      setMessage('Settings updated successfully!');
      setTimeout(() => setMessage(''), 3000);
    } catch (error: any) {
      setMessage(error.message || 'Failed to update settings');
    } finally {
      setSaving(false);
    }
  };

  const handleToggle = (index: number) => {
    // Handle privacy toggle
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

  const dailyPercentage = settings ? (stats.dailySpent / settings.dailyLimit) * 100 : 0;
  const monthlyPercentage = settings ? (stats.monthlySpent / settings.monthlyLimit) * 100 : 0;

  return (
    <DashboardLayout>
      <div className="space-y-8">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Account Settings</h1>
          <p className="text-muted-foreground mt-2">Manage your account preferences and advanced settings.</p>
        </div>

        {message && (
          <div className={`p-4 rounded-lg ${message.includes('success') ? 'bg-primary/20 text-primary' : 'bg-destructive/20 text-destructive'}`}>
            {message}
          </div>
        )}

        <div className="bg-card/10 backdrop-blur-sm rounded-lg border border-border/20">
          <div className="p-6 border-b border-border/20">
            <h2 className="text-xl font-semibold text-card-foreground">Account Limits</h2>
          </div>
          <div className="p-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-4">
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-medium text-card-foreground">Daily Transaction Limit</span>
                    <span className="text-sm text-muted-foreground">
                      ${stats.dailySpent.toFixed(2)} / ${settings?.dailyLimit?.toFixed(2)}
                    </span>
                  </div>
                  <div className="w-full bg-muted/20 rounded-full h-2">
                    <div className="bg-primary h-2 rounded-full" style={{ width: `${Math.min(dailyPercentage, 100)}%` }}></div>
                  </div>
                  <input
                    type="number"
                    value={settings?.dailyLimit || 0}
                    onChange={(e) => handleLimitChange('dailyLimit', parseFloat(e.target.value))}
                    className="mt-2 w-full bg-input border border-border rounded-lg px-3 py-2 text-foreground"
                  />
                </div>
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-medium text-card-foreground">Monthly Transaction Limit</span>
                    <span className="text-sm text-muted-foreground">
                      ${stats.monthlySpent.toFixed(2)} / ${settings?.monthlyLimit?.toFixed(2)}
                    </span>
                  </div>
                  <div className="w-full bg-muted/20 rounded-full h-2">
                    <div className="bg-primary h-2 rounded-full" style={{ width: `${Math.min(monthlyPercentage, 100)}%` }}></div>
                  </div>
                  <input
                    type="number"
                    value={settings?.monthlyLimit || 0}
                    onChange={(e) => handleLimitChange('monthlyLimit', parseFloat(e.target.value))}
                    className="mt-2 w-full bg-input border border-border rounded-lg px-3 py-2 text-foreground"
                  />
                </div>
              </div>
              <div className="space-y-4">
                <div>
                  <span className="text-sm font-medium text-card-foreground">Maximum Single Transaction</span>
                  <p className="text-2xl font-bold text-primary">${settings?.maxSingleTransaction?.toFixed(2)}</p>
                  <input
                    type="number"
                    value={settings?.maxSingleTransaction || 0}
                    onChange={(e) => handleLimitChange('maxSingleTransaction', parseFloat(e.target.value))}
                    className="mt-2 w-full bg-input border border-border rounded-lg px-3 py-2 text-foreground"
                  />
                </div>
                <div>
                  <span className="text-sm font-medium text-card-foreground">Payment Methods</span>
                  <p className="text-2xl font-bold text-primary">{stats.activePaymentMethods} / {settings?.paymentMethodLimit}</p>
                  <input
                    type="number"
                    value={settings?.paymentMethodLimit || 5}
                    onChange={(e) => handleLimitChange('paymentMethodLimit', parseInt(e.target.value))}
                    min="1"
                    max="10"
                    className="mt-2 w-full bg-input border border-border rounded-lg px-3 py-2 text-foreground"
                  />
                </div>
              </div>
            </div>
            <button 
              onClick={handleSave}
              disabled={saving}
              className="mt-6 bg-primary text-primary-foreground px-6 py-3 rounded-lg font-medium hover:bg-primary/90 transition-colors disabled:opacity-50"
            >
              {saving ? 'Saving...' : 'Save Changes'}
            </button>
          </div>
        </div>

        <div className="bg-card/10 backdrop-blur-sm rounded-lg border border-border/20">
          <div className="p-6 border-b border-border/20">
            <h2 className="text-xl font-semibold text-card-foreground">Privacy Settings</h2>
          </div>
          <div className="p-6 space-y-6">
            {[
              {
                title: "Data Collection",
                description: "Allow PayBridge to collect usage data to improve our services",
                enabled: settings?.privacySettings?.shareDataWithPartners || false,
              },
              {
                title: "Marketing Communications",
                description: "Receive promotional emails and product updates",
                enabled: settings?.privacySettings?.allowMarketingEmails || false,
              },
              {
                title: "Transaction History Sharing",
                description: "Share anonymized transaction data for fraud prevention",
                enabled: settings?.privacySettings?.showTransactionHistory || true,
              },
            ].map((setting, index) => (
              <div key={index} className="flex items-center justify-between p-4 bg-muted/10 rounded-lg">
                <div className="flex-1">
                  <p className="font-medium text-card-foreground">{setting.title}</p>
                  <p className="text-sm text-muted-foreground">{setting.description}</p>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input 
                    type="checkbox" 
                    className="sr-only peer" 
                    defaultChecked={setting.enabled}
                    onChange={() => handleToggle(index)}
                  />
                  <div className="w-11 h-6 bg-input peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-ring/20 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary"></div>
                </label>
              </div>
            ))}
          </div>
        </div>

        <div className="bg-card/10 backdrop-blur-sm rounded-lg border border-border/20">
          <div className="p-6 border-b border-border/20">
            <h2 className="text-xl font-semibold text-card-foreground">Data Management</h2>
          </div>
          <div className="p-6 space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-4">
                <div>
                  <h3 className="font-medium text-card-foreground mb-2">Export Your Data</h3>
                  <p className="text-sm text-muted-foreground mb-4">
                    Download a copy of all your account data, including transactions, payment methods, and settings.
                  </p>
                  <button className="bg-primary text-primary-foreground px-4 py-2 rounded-lg font-medium hover:bg-primary/90 transition-colors">
                    Request Data Export
                  </button>
                </div>
              </div>
              <div className="space-y-4">
                <div>
                  <h3 className="font-medium text-card-foreground mb-2">Data Retention</h3>
                  <p className="text-sm text-muted-foreground mb-4">
                    Current setting: {settings?.dataRetention || '2 years'}
                  </p>
                  <button className="border border-border text-card-foreground px-4 py-2 rounded-lg font-medium hover:bg-muted/10 transition-colors">
                    Learn More
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-destructive/10 rounded-lg border border-destructive/20">
          <div className="p-6 border-b border-destructive/20">
            <h2 className="text-xl font-semibold text-destructive">Danger Zone</h2>
          </div>
          <div className="p-6 space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <h3 className="font-medium text-destructive mb-2">Deactivate Account</h3>
                <p className="text-sm text-destructive/80 mb-4">
                  Temporarily disable your account. You can reactivate it anytime by logging in.
                </p>
                <button className="border border-destructive text-destructive px-4 py-2 rounded-lg font-medium hover:bg-destructive/10 transition-colors">
                  Deactivate Account
                </button>
              </div>
              <div>
                <h3 className="font-medium text-destructive mb-2">Delete Account</h3>
                <p className="text-sm text-destructive/80 mb-4">
                  Permanently delete your account and all associated data. This action cannot be undone.
                </p>
                <button className="bg-destructive text-destructive-foreground px-4 py-2 rounded-lg font-medium hover:bg-destructive/90 transition-colors">
                  Delete Account
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}