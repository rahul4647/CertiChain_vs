import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { CheckCircle2, ArrowRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Slider } from '@/components/ui/slider';
import { LandingHeader } from '@/components/LandingHeader';
import { Footer } from '@/components/Footer';

export const PricingPage = () => {
  const [learnerCount, setLearnerCount] = useState(100);
  
  const calculatePrice = (learners) => {
    if (learners <= 100) return 29;
    if (learners <= 500) return 99;
    if (learners <= 1000) return 199;
    return 399;
  };
  
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-slate-100">
      <LandingHeader />
      
      <section className="pt-32 pb-20 px-4">
        <div className="container mx-auto max-w-6xl">
          <div className="text-center mb-16" data-aos="fade-up">
            <h1 className="text-5xl lg:text-6xl font-bold text-slate-900 mb-6">Simple, Transparent Pricing</h1>
            <p className="text-xl text-slate-600">Choose the plan that fits your needs. No hidden fees.</p>
          </div>
          
          <div className="grid md:grid-cols-2 gap-8 max-w-5xl mx-auto">
            {/* Starter Plan */}
            <Card className="border-2 border-slate-200 hover:border-blue-500 hover:shadow-2xl transition-all duration-300" data-aos="fade-right">
              <CardContent className="p-10">
                <div className="text-center mb-8">
                  <h2 className="text-3xl font-bold text-slate-900 mb-4">Starter</h2>
                  <div className="text-5xl font-bold text-blue-600 mb-2">Free</div>
                  <p className="text-slate-600">Forever free for small groups</p>
                </div>
                
                <ul className="space-y-4 mb-10">
                  <li className="flex items-start gap-3">
                    <CheckCircle2 className="w-6 h-6 text-green-600 flex-shrink-0 mt-0.5" />
                    <span className="text-slate-700"><strong>Up to 50 learners</strong> per group</span>
                  </li>
                  <li className="flex items-start gap-3">
                    <CheckCircle2 className="w-6 h-6 text-green-600 flex-shrink-0 mt-0.5" />
                    <span className="text-slate-700"><strong>1 certificate group</strong> active at a time</span>
                  </li>
                  <li className="flex items-start gap-3">
                    <CheckCircle2 className="w-6 h-6 text-green-600 flex-shrink-0 mt-0.5" />
                    <span className="text-slate-700">Basic template designer</span>
                  </li>
                  <li className="flex items-start gap-3">
                    <CheckCircle2 className="w-6 h-6 text-green-600 flex-shrink-0 mt-0.5" />
                    <span className="text-slate-700">QR code verification</span>
                  </li>
                  <li className="flex items-start gap-3">
                    <CheckCircle2 className="w-6 h-6 text-green-600 flex-shrink-0 mt-0.5" />
                    <span className="text-slate-700">Blockchain minting</span>
                  </li>
                  <li className="flex items-start gap-3">
                    <CheckCircle2 className="w-6 h-6 text-green-600 flex-shrink-0 mt-0.5" />
                    <span className="text-slate-700">Email support</span>
                  </li>
                </ul>
                
                <Link to="/signup" className="block">
                  <Button className="w-full py-6 text-lg rounded-xl border-2" variant="outline">
                    Get Started Free
                  </Button>
                </Link>
              </CardContent>
            </Card>
            
            {/* Pro Plan */}
            <Card className="border-2 border-blue-500 bg-gradient-to-br from-blue-50 to-white relative overflow-hidden shadow-2xl" data-aos="fade-left">
              <div className="absolute top-0 right-0 bg-blue-600 text-white px-6 py-2 rounded-bl-2xl text-sm font-bold">
                POPULAR
              </div>
              <CardContent className="p-10">
                <div className="text-center mb-8">
                  <h2 className="text-3xl font-bold text-slate-900 mb-4">Pro</h2>
                  <div className="text-5xl font-bold text-blue-600 mb-2">
                    ${calculatePrice(learnerCount)}
                    <span className="text-xl text-slate-600">/month</span>
                  </div>
                  <p className="text-slate-600">For professionals & organizations</p>
                </div>
                
                <div className="mb-8 p-6 bg-white rounded-xl shadow-sm">
                  <label className="block text-sm font-medium text-slate-700 mb-4">
                    Number of Learners: <span className="text-blue-600 font-bold">{learnerCount}</span>
                  </label>
                  <Slider
                    value={[learnerCount]}
                    onValueChange={(value) => setLearnerCount(value[0])}
                    max={2000}
                    min={50}
                    step={50}
                    className="mb-2"
                  />
                  <div className="flex justify-between text-xs text-slate-500">
                    <span>50</span>
                    <span>2000+</span>
                  </div>
                </div>
                
                <ul className="space-y-4 mb-10">
                  <li className="flex items-start gap-3">
                    <CheckCircle2 className="w-6 h-6 text-green-600 flex-shrink-0 mt-0.5" />
                    <span className="text-slate-700"><strong>Unlimited learners</strong></span>
                  </li>
                  <li className="flex items-start gap-3">
                    <CheckCircle2 className="w-6 h-6 text-green-600 flex-shrink-0 mt-0.5" />
                    <span className="text-slate-700"><strong>Unlimited certificate groups</strong></span>
                  </li>
                  <li className="flex items-start gap-3">
                    <CheckCircle2 className="w-6 h-6 text-green-600 flex-shrink-0 mt-0.5" />
                    <span className="text-slate-700">Advanced template designer</span>
                  </li>
                  <li className="flex items-start gap-3">
                    <CheckCircle2 className="w-6 h-6 text-green-600 flex-shrink-0 mt-0.5" />
                    <span className="text-slate-700">Custom branding & logos</span>
                  </li>
                  <li className="flex items-start gap-3">
                    <CheckCircle2 className="w-6 h-6 text-green-600 flex-shrink-0 mt-0.5" />
                    <span className="text-slate-700">Priority support (24/7)</span>
                  </li>
                  <li className="flex items-start gap-3">
                    <CheckCircle2 className="w-6 h-6 text-green-600 flex-shrink-0 mt-0.5" />
                    <span className="text-slate-700">Analytics & insights</span>
                  </li>
                  <li className="flex items-start gap-3">
                    <CheckCircle2 className="w-6 h-6 text-green-600 flex-shrink-0 mt-0.5" />
                    <span className="text-slate-700">API access</span>
                  </li>
                </ul>
                
                <Link to="/signup" className="block">
                  <Button className="w-full bg-blue-600 hover:bg-blue-700 text-white py-6 text-lg rounded-xl shadow-lg hover:shadow-xl transition-all duration-300">
                    Start Pro Trial
                    <ArrowRight className="ml-2 w-5 h-5" />
                  </Button>
                </Link>
              </CardContent>
            </Card>
          </div>
          
          {/* FAQ Section */}
          <div className="mt-20 max-w-3xl mx-auto" data-aos="fade-up">
            <h2 className="text-3xl font-bold text-slate-900 text-center mb-12">Frequently Asked Questions</h2>
            <div className="space-y-6">
              <Card>
                <CardContent className="p-6">
                  <h3 className="font-bold text-lg text-slate-900 mb-2">Can I upgrade or downgrade anytime?</h3>
                  <p className="text-slate-600">Yes! You can change your plan at any time. Changes take effect immediately.</p>
                </CardContent>
              </Card>
              
              <Card>
                <CardContent className="p-6">
                  <h3 className="font-bold text-lg text-slate-900 mb-2">What happens if I exceed the learner limit?</h3>
                  <p className="text-slate-600">You'll be prompted to upgrade to the Pro plan to continue issuing certificates.</p>
                </CardContent>
              </Card>
              
              <Card>
                <CardContent className="p-6">
                  <h3 className="font-bold text-lg text-slate-900 mb-2">Is there a free trial for Pro?</h3>
                  <p className="text-slate-600">Yes! All Pro plans come with a 14-day free trial. No credit card required.</p>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </section>
      
      <Footer />
    </div>
  );
};
