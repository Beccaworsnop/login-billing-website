'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import DashboardLayout from "../../../../components/dash-layout";
import { useAuth } from '@/app/contexts/authContext';
import { transactionsAPI, paymentMethodsAPI } from '@/app/lib/api';

export default function MakePaymentPage() {
  const { isAuthenticated, isLoading } = useAuth();
  const router = useRouter();
  
  const [paymentMethods, setPaymentMethods] = useState<any[]>([]);
  const [formData, setFormData] = useState({
    amount: '',
    methodId: '',
    description: ''
  });
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      router.push('/login');
    }
  }, [isAuthenticated, isLoading, router]);

  useEffect(() => {
    fetchPaymentMethods();
  }, [isAuthenticated]);

  const fetchPaymentMethods = async () => {
    if (!isAuthenticated) return;

    try {
      setLoading(true);
      const data = await paymentMethodsAPI.getAll();
      setPaymentMethods(data.paymentMethods?.filter((m: any) => m.isActive) || []);
      
      if (data.paymentMethods?.length > 0) {
        setFormData(prev => ({
          ...prev,
          methodId: data.paymentMethods[0].id
        }));
      }
    } catch (error) {
      console.error('Failed to fetch payment methods:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    setFormData(prev => ({
      ...prev,
      [e.target.name]: e.target.value
    }));
  };

  const calculateFee = (amount: number) => {
    return amount * 0.029; // 2.9% fee
  };

  const calculateTotal = () => {
    const amount = parseFloat(formData.amount) || 0;
    const fee = calculateFee(amount);
    return amount + fee;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSubmitting(true);

    try {
      const amount = parseFloat(formData.amount);
      
      if (isNaN(amount) || amount <= 0) {
        throw new Error('Please enter a valid amount');
      }

      if (!formData.methodId) {
        throw new Error('Please select a payment method');
      }

      await transactionsAPI.create({
        amount,
        methodId: formData.methodId,
        description: formData.description || 'Payment transaction'
      });

      router.push('/dashboard/history');
    } catch (err: any) {
      setError(err.message || 'Failed to process payment');
    } finally {
      setSubmitting(false);
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

  if (paymentMethods.length === 0) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center min-h-screen">
          <div className="text-center">
            <div className="w-16 h-16 bg-muted/20 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg className="w-8 h-8 text-muted-foreground" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
              </svg>
            </div>
            <h3 className="text-lg font-semibold text-card-foreground mb-2">No Payment Methods</h3>
            <p className="text-muted-foreground mb-6">You need to add a payment method before making a payment</p>
            <button
              onClick={() => router.push('/dashboard/add-payment')}
              className="bg-primary text-primary-foreground px-6 py-3 rounded-lg font-medium hover:bg-primary/90 transition-colors"
            >
              Add Payment Method
            </button>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="space-y-8">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Make Payment</h1>
          <p className="text-muted-foreground mt-2">Process a payment when a website doesn't accept your card.</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          <div className="bg-card/10 backdrop-blur-sm rounded-lg border border-border/20">
            <div className="p-6 border-b border-border/20">
              <h2 className="text-xl font-semibold text-card-foreground">Payment Details</h2>
              <p className="text-sm text-muted-foreground mt-1">Enter the payment information</p>
            </div>
            <div className="p-6">
              {error && (
                <div className="mb-6 bg-destructive/20 border border-destructive text-destructive px-4 py-3 rounded-lg">
                  {error}
                </div>
              )}

              <form className="space-y-6" onSubmit={handleSubmit}>
                <div>
                  <label className="block text-sm font-medium text-card-foreground mb-2">Payment Amount</label>
                  <div className="relative">
                    <span className="absolute left-4 top-1/2 transform -translate-y-1/2 text-muted-foreground">$</span>
                    <input
                      type="number"
                      name="amount"
                      value={formData.amount}
                      onChange={handleChange}
                      step="0.01"
                      min="0.01"
                      placeholder="0.00"
                      required
                      className="w-full bg-input border border-border rounded-lg pl-8 pr-4 py-3 text-foreground placeholder-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-card-foreground mb-2">Payment Method</label>
                  <select 
                    name="methodId"
                    value={formData.methodId}
                    onChange={handleChange}
                    required
                    className="w-full bg-input border border-border rounded-lg px-4 py-3 text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
                  >
                    {paymentMethods.map((method) => (
                      <option key={method.id} value={method.id}>
                        {method.provider} ending in {method.last4Digits}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-card-foreground mb-2">Description (Optional)</label>
                  <textarea
                    name="description"
                    value={formData.description}
                    onChange={handleChange}
                    rows={3}
                    placeholder="Brief description of the purchase"
                    className="w-full bg-input border border-border rounded-lg px-4 py-3 text-foreground placeholder-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring resize-none"
                  ></textarea>
                </div>

                <div className="bg-muted/10 rounded-lg p-4">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-card-foreground">Subtotal</span>
                    <span className="text-card-foreground">${(parseFloat(formData.amount) || 0).toFixed(2)}</span>
                  </div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-card-foreground">PayBridge Fee (2.9%)</span>
                    <span className="text-card-foreground">${calculateFee(parseFloat(formData.amount) || 0).toFixed(2)}</span>
                  </div>
                  <div className="border-t border-border/20 pt-2">
                    <div className="flex items-center justify-between">
                      <span className="font-semibold text-card-foreground">Total</span>
                      <span className="font-semibold text-card-foreground">${calculateTotal().toFixed(2)}</span>
                    </div>
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={submitting}
                  className="w-full bg-primary text-primary-foreground py-3 rounded-lg font-semibold hover:bg-primary/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {submitting ? 'Processing Payment...' : 'Process Payment'}
                </button>
              </form>
            </div>
          </div>

          <div className="space-y-6">
            <div className="bg-card/10 backdrop-blur-sm rounded-lg border border-border/20 p-6">
              <h3 className="text-lg font-semibold text-card-foreground mb-4">How PayBridge Works</h3>
              <div className="space-y-4">
                <div className="flex items-start space-x-3">
                  <div className="w-8 h-8 bg-primary rounded-full flex items-center justify-center text-white font-bold text-sm">1</div>
                  <div>
                    <p className="font-medium text-card-foreground">Enter Payment Details</p>
                    <p className="text-sm text-muted-foreground">Enter the amount and select your payment method</p>
                  </div>
                </div>
                <div className="flex items-start space-x-3">
                  <div className="w-8 h-8 bg-primary rounded-full flex items-center justify-center text-white font-bold text-sm">2</div>
                  <div>
                    <p className="font-medium text-card-foreground">We Process Payment</p>
                    <p className="text-sm text-muted-foreground">PayBridge securely processes your transaction</p>
                  </div>
                </div>
                <div className="flex items-start space-x-3">
                  <div className="w-8 h-8 bg-primary rounded-full flex items-center justify-center text-white font-bold text-sm">3</div>
                  <div>
                    <p className="font-medium text-card-foreground">Instant Confirmation</p>
                    <p className="text-sm text-muted-foreground">Get immediate confirmation and receipt</p>
                  </div>
                </div>
              </div>
            </div>

            <div className="bg-card/10 backdrop-blur-sm rounded-lg border border-border/20 p-6">
              <h3 className="text-lg font-semibold text-card-foreground mb-4">Payment Protection</h3>
              <div className="space-y-3">
                {[
                  '100% fraud protection',
                  'Dispute resolution support',
                  '24/7 customer support',
                  'Instant refund processing'
                ].map((feature, i) => (
                  <div key={i} className="flex items-center space-x-3">
                    <svg className="w-5 h-5 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                    <span className="text-sm text-card-foreground">{feature}</span>
                  </div>
                ))}
              </div>
            </div>

            <div className="bg-primary/10 rounded-lg p-4 border border-primary/20">
              <div className="flex items-start space-x-3">
                <svg className="w-5 h-5 text-primary mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <div>
                  <p className="text-sm font-medium text-primary">Processing Fee</p>
                  <p className="text-xs text-primary/80">A 2.9% processing fee is added to cover transaction costs and ensure secure payment processing.</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}