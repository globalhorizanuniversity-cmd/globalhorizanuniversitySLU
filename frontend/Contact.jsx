import React, { useState } from 'react';
import axios from 'axios';
import Layout from '@/components/Layout';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Mail, Phone, MapPin } from 'lucide-react';
import { toast } from 'sonner';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;

const Contact = ({ user, setUser }) => {
  const [feedback, setFeedback] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    const wordCount = feedback.trim().split(/\s+/).length;
    if (wordCount > 200) {
      toast.error('Feedback must not exceed 200 words');
      return;
    }

    setLoading(true);
    try {
      const response = await axios.post(`${BACKEND_URL}/api/feedback`, { message: feedback });
      toast.success(response.data.message);
      setFeedback('');
    } catch (error) {
      toast.error(error.response?.data?.detail || 'Failed to submit feedback');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Layout user={user} setUser={setUser}>
      <div className="p-6 lg:p-12 fade-in" data-testid="contact-page">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-12">
            <h1 className="text-4xl font-bold text-blue-900 mb-4" data-testid="contact-heading">Contact Us</h1>
            <p className="text-base text-gray-600">We'd love to hear from you. Get in touch with the alumni office.</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-12">
            {/* Contact Information */}
            <div className="bg-gradient-to-br from-blue-600 to-purple-600 text-white rounded-3xl p-8 shadow-2xl">
              <h2 className="text-2xl font-bold mb-6">Get In Touch</h2>
              
              <div className="space-y-6">
                <div className="flex items-start gap-4" data-testid="contact-email">
                  <div className="bg-white/20 p-3 rounded-full">
                    <Mail className="w-6 h-6" />
                  </div>
                  <div>
                    <p className="font-semibold mb-1">Email</p>
                    <p className="text-sm">alumni@globalhorizon.edu</p>
                  </div>
                </div>

                <div className="flex items-start gap-4" data-testid="contact-phone">
                  <div className="bg-white/20 p-3 rounded-full">
                    <Phone className="w-6 h-6" />
                  </div>
                  <div>
                    <p className="font-semibold mb-1">Phone</p>
                    <p className="text-sm">(555) 123-4567</p>
                  </div>
                </div>

                <div className="flex items-start gap-4" data-testid="contact-address">
                  <div className="bg-white/20 p-3 rounded-full">
                    <MapPin className="w-6 h-6" />
                  </div>
                  <div>
                    <p className="font-semibold mb-1">Address</p>
                    <p className="text-sm">123 Horizon Blvd<br />San Francisco, CA 94105<br />United States</p>
                  </div>
                </div>
              </div>

              <div className="mt-8">
                <img
                  src="https://images.unsplash.com/photo-1576495199011-eb94736d05d6"
                  alt="Campus"
                  className="rounded-2xl shadow-lg"
                />
              </div>
            </div>

            {/* Feedback Form */}
            <div className="bg-white rounded-3xl shadow-2xl p-8">
              <h2 className="text-2xl font-bold text-blue-900 mb-6">Send Us Feedback</h2>
              
              <form onSubmit={handleSubmit} className="space-y-6" data-testid="feedback-form">
                <div>
                  <Label htmlFor="feedback">Your Feedback (Max 200 words)</Label>
                  <Textarea
                    id="feedback"
                    value={feedback}
                    onChange={(e) => setFeedback(e.target.value)}
                    placeholder="Share your thoughts, suggestions, or questions..."
                    rows={8}
                    required
                    className="mt-2"
                    data-testid="feedback-textarea"
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    {feedback.trim().split(/\s+/).filter(word => word.length > 0).length} / 200 words
                  </p>
                </div>

                <Button
                  type="submit"
                  disabled={loading}
                  className="w-full bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 py-6 text-lg rounded-full font-semibold"
                  data-testid="feedback-submit-button"
                >
                  {loading ? 'Submitting...' : 'Submit Feedback'}
                </Button>
              </form>
            </div>
          </div>

          {/* Map or Additional Info */}
          <div className="bg-white rounded-3xl shadow-2xl overflow-hidden">
            <div className="aspect-video bg-gray-200 flex items-center justify-center">
              <img
                src="https://images.unsplash.com/photo-1583373834259-46cc92173cb7"
                alt="Campus Map"
                className="w-full h-full object-cover"
              />
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
};

export default Contact;