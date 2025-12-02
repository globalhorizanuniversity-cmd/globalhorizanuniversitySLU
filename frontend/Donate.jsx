import React, { useState } from 'react';
import axios from 'axios';
import Layout from '@/components/Layout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { toast } from 'sonner';
import confetti from 'canvas-confetti';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;

const Donate = ({ user, setUser }) => {
  const [paymentModalOpen, setPaymentModalOpen] = useState(false);
  const [formData, setFormData] = useState({
    name: user?.full_name || '',
    email: user?.email || '',
    phone: '',
    amount: '',
    purpose: '',
    message: ''
  });
  const [paymentData, setPaymentData] = useState({
    cardNumber: '',
    expiry: '',
    cvv: '',
    upi: ''
  });

  const causes = [
    {
      title: 'Scholarship Fund',
      image: 'https://images.unsplash.com/photo-1522202176988-66273c2fd55f',
      description: 'Help deserving students achieve their dreams through quality education'
    },
    {
      title: 'Infrastructure Development',
      image: 'https://images.unsplash.com/photo-1576495199011-eb94736d05d6',
      description: 'Build state-of-the-art facilities for better learning experiences'
    },
    {
      title: 'Research & Innovation',
      image: 'https://images.unsplash.com/photo-1614934273187-c83f8780fad9',
      description: 'Support groundbreaking research projects and innovation initiatives'
    }
  ];

  const formatPhoneNumber = (value) => {
    const numbers = value.replace(/\D/g, '');
    if (numbers.length <= 3) return numbers;
    if (numbers.length <= 6) return `(${numbers.slice(0, 3)}) ${numbers.slice(3)}`;
    return `(${numbers.slice(0, 3)}) ${numbers.slice(3, 6)}-${numbers.slice(6, 10)}`;
  };

  const handlePhoneChange = (e) => {
    const formatted = formatPhoneNumber(e.target.value);
    setFormData({ ...formData, phone: formatted });
  };

  const handleProceedToPay = (e) => {
    e.preventDefault();
    
    const phonePattern = /^\(\d{3}\) \d{3}-\d{4}$/;
    if (!phonePattern.test(formData.phone)) {
      toast.error('Phone must be in format (XXX) XXX-XXXX');
      return;
    }

    const amount = parseFloat(formData.amount);
    if (amount < 10 || amount > 10000) {
      toast.error('Amount must be between $10 and $10,000');
      return;
    }

    setPaymentModalOpen(true);
  };

  const handlePayment = async (e) => {
    e.preventDefault();
    
    try {
      const token = localStorage.getItem('token');
      const donationData = {
        name: formData.name,
        email: formData.email,
        phone: formData.phone,
        amount: parseFloat(formData.amount),
        purpose: formData.purpose,
        message: formData.message
      };
      
      const response = await axios.post(
        `${BACKEND_URL}/api/donations`,
        donationData,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      
      // Trigger confetti
      confetti({
        particleCount: 100,
        spread: 70,
        origin: { y: 0.6 }
      });
      
      toast.success(response.data.message);
      setPaymentModalOpen(false);
      
      // Reset form
      setFormData({
        name: user?.full_name || '',
        email: user?.email || '',
        phone: '',
        amount: '',
        purpose: '',
        message: ''
      });
      setPaymentData({ cardNumber: '', expiry: '', cvv: '', upi: '' });
    } catch (error) {
      toast.error(error.response?.data?.detail || 'Payment failed');
    }
  };

  return (
    <Layout user={user} setUser={setUser}>
      <div className="p-6 lg:p-12 fade-in" data-testid="donate-page">
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-blue-900 mb-4" data-testid="donate-heading">Give Back to Your Alma Mater</h1>
          <p className="text-base text-gray-600 max-w-2xl mx-auto">
            Your contribution builds tomorrow. Support the next generation of Global Horizon students.
          </p>
        </div>

        {/* Causes Section */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
          {causes.map((cause, index) => (
            <div key={index} className="bg-white rounded-2xl shadow-lg overflow-hidden hover-lift" data-testid={`cause-${index}`}>
              <div className="aspect-video overflow-hidden">
                <img src={cause.image} alt={cause.title} className="w-full h-full object-cover" />
              </div>
              <div className="p-6">
                <h3 className="text-xl font-bold text-blue-900 mb-2">{cause.title}</h3>
                <p className="text-sm text-gray-700">{cause.description}</p>
              </div>
            </div>
          ))}
        </div>

        {/* Donation Form */}
        <div className="max-w-2xl mx-auto bg-white rounded-3xl shadow-2xl p-8">
          <h2 className="text-3xl font-bold text-blue-900 mb-6">Make Your Contribution</h2>
          
          <form onSubmit={handleProceedToPay} className="space-y-6" data-testid="donation-form">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <Label htmlFor="name">Name</Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  required
                  data-testid="donation-name-input"
                />
              </div>

              <div>
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  required
                  data-testid="donation-email-input"
                />
              </div>
            </div>

            <div>
              <Label htmlFor="phone">Phone (US Format)</Label>
              <Input
                id="phone"
                value={formData.phone}
                onChange={handlePhoneChange}
                placeholder="(555) 123-4567"
                required
                data-testid="donation-phone-input"
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <Label htmlFor="amount">Amount ($10 - $10,000)</Label>
                <Input
                  id="amount"
                  type="number"
                  min="10"
                  max="10000"
                  value={formData.amount}
                  onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
                  required
                  data-testid="donation-amount-input"
                />
              </div>

              <div>
                <Label htmlFor="purpose">Purpose</Label>
                <Input
                  id="purpose"
                  value={formData.purpose}
                  onChange={(e) => setFormData({ ...formData, purpose: e.target.value })}
                  required
                  data-testid="donation-purpose-input"
                />
              </div>
            </div>

            <div>
              <Label htmlFor="message">Message (Optional)</Label>
              <Textarea
                id="message"
                value={formData.message}
                onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                rows={3}
                data-testid="donation-message-input"
              />
            </div>

            <Button
              type="submit"
              className="w-full bg-gradient-to-r from-orange-600 to-red-600 hover:from-orange-700 hover:to-red-700 text-white py-6 text-lg rounded-full font-semibold"
              data-testid="proceed-to-pay-button"
            >
              Proceed to Pay
            </Button>
          </form>
        </div>
      </div>

      {/* Payment Modal */}
      <Dialog open={paymentModalOpen} onOpenChange={setPaymentModalOpen}>
        <DialogContent data-testid="payment-modal">
          <DialogHeader>
            <DialogTitle>Complete Payment</DialogTitle>
          </DialogHeader>
          
          <form onSubmit={handlePayment} className="space-y-4">
            <div>
              <Label htmlFor="cardNumber">Card Number</Label>
              <Input
                id="cardNumber"
                value={paymentData.cardNumber}
                onChange={(e) => setPaymentData({ ...paymentData, cardNumber: e.target.value })}
                placeholder="1234 5678 9012 3456"
                required
                data-testid="card-number-input"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="expiry">Expiry</Label>
                <Input
                  id="expiry"
                  value={paymentData.expiry}
                  onChange={(e) => setPaymentData({ ...paymentData, expiry: e.target.value })}
                  placeholder="MM/YY"
                  required
                  data-testid="expiry-input"
                />
              </div>

              <div>
                <Label htmlFor="cvv">CVV</Label>
                <Input
                  id="cvv"
                  value={paymentData.cvv}
                  onChange={(e) => setPaymentData({ ...paymentData, cvv: e.target.value })}
                  placeholder="123"
                  required
                  data-testid="cvv-input"
                />
              </div>
            </div>

            <div>
              <Label htmlFor="upi">UPI ID (Optional)</Label>
              <Input
                id="upi"
                value={paymentData.upi}
                onChange={(e) => setPaymentData({ ...paymentData, upi: e.target.value })}
                placeholder="yourname@upi"
                data-testid="upi-input"
              />
            </div>

            <Button
              type="submit"
              className="w-full bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700"
              data-testid="payment-submit-button"
            >
              Pay ${formData.amount}
            </Button>
          </form>
        </DialogContent>
      </Dialog>
    </Layout>
  );
};

export default Donate;