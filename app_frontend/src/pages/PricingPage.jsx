import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { CheckCircle2, ArrowRight, Zap, Crown, X, ShoppingCart } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { LandingHeader } from '@/components/LandingHeader';
import { Footer } from '@/components/Footer';
import { supabase } from '@/supabaseClient';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;

export const PricingPage = () => {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [subscriptionStatus, setSubscriptionStatus] = useState(null);
  const [selectedPackage, setSelectedPackage] = useState(null);
  const [loading, setLoading] = useState(false);
  
  // Credit packages
  const creditPackages = [
    { id: 'starter', name: 'Starter', credits: 50, price: 9.99, popular: false },
    { id: 'basic', name: 'Basic', credits: 100, price: 19.99, popular: false },
    { id: 'standard', name: 'Standard', credits: 250, price: 39.99, popular: true },
    { id: 'premium', name: 'Premium', credits: 500, price: 69.99, popular: false },
    { id: 'enterprise', name: 'Enterprise', credits: 1000, price: 119.99, popular: false },
  ];

  // Load user session and subscription status
  useEffect(() => {
    const loadUserData = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      setUser(session?.user || null);
      
      if (session?.user) {
        try {
          const res = await fetch(`${BACKEND_URL}/api/subscription/status/${session.user.id}`);
          if (res.ok) {
            const data = await res.json();
            setSubscriptionStatus(data);
          }
        } catch (err) {
          console.error('Failed to load subscription status:', err);
        }
      }
    };
    loadUserData();
  }, []);

  // Upgrade to Pro
  const handleUpgradeToPro = async () => {
    if (!user) {
      navigate('/signup');
      return;
    }
    
    setLoading(true);
    try {
      const res = await fetch(`${BACKEND_URL}/api/subscription/upgrade`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ user_id: user.id, duration_months: 1 })
      });
      
      if (res.ok) {
        const data = await res.json();
        alert(`🎉 ${data.message}`);
        // Refresh subscription status
        const statusRes = await fetch(`${BACKEND_URL}/api/subscription/status/${user.id}`);
        if (statusRes.ok) {
          setSubscriptionStatus(await statusRes.json());
        }
      } else {
        const error = await res.json();
        alert(`Error: ${error.detail}`);
      }
    } catch (err) {
      alert('Failed to upgrade. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  // Purchase credits
  const handlePurchaseCredits = async (packageId) => {
    if (!user) {
      navigate('/signup');
      return;
    }
    
    setLoading(true);
    try {
      const res = await fetch(`${BACKEND_URL}/api/subscription/purchase-credits`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ user_id: user.id, package: packageId })
      });
      
      if (res.ok) {
        const data = await res.json();
        alert(`🎉 ${data.message}! Total credits: ${data.total_credits}`);
        // Refresh subscription status
        const statusRes = await fetch(`${BACKEND_URL}/api/subscription/status/${user.id}`);
        if (statusRes.ok) {
          setSubscriptionStatus(await statusRes.json());
        }
      } else {
        const error = await res.json();
        alert(`Error: ${error.detail}`);
      }
    } catch (err) {
      alert('Failed to purchase credits. Please try again.');
    } finally {
      setLoading(false);
    }
  };
  
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-slate-100">
      <LandingHeader />
      
      <section className="pt-32 pb-20 px-4">
        <div className="container mx-auto max-w-6xl">
          <div className="text-center mb-16" data-aos="fade-up">
            <h1 className="text-5xl lg:text-6xl font-bold text-slate-900 mb-6">Simple, Transparent Pricing</h1>
            <p className="text-xl text-slate-600">Start free, upgrade when you need more power.</p>
            
            {/* Show current subscription status if logged in */}
            {subscriptionStatus && (
              <div className="mt-6 inline-flex items-center gap-4 bg-white rounded-xl px-6 py-3 shadow-sm border">
                <span className="text-slate-600">Your Plan:</span>
                <Badge className={subscriptionStatus.is_pro ? "bg-purple-100 text-purple-800" : "bg-slate-100 text-slate-800"}>
                  {subscriptionStatus.is_pro ? '👑 Pro' : 'Free'}
                </Badge>
                <span className="text-slate-600">|</span>
                <span className="text-slate-700">
                  <Zap className="w-4 h-4 inline mr-1 text-yellow-500" />
                  {subscriptionStatus.mint_credits} credits
                </span>
                <span className="text-slate-600">|</span>
                <span className="text-slate-700">
                  {subscriptionStatus.groups_created} / {subscriptionStatus.groups_limit === -1 ? '∞' : subscriptionStatus.groups_limit} groups
                </span>
              </div>
            )}
          </div>
          
          {/* Plans */}
          <div className="grid md:grid-cols-2 gap-8 max-w-5xl mx-auto mb-20">
            
            {/* Free Plan */}
            <Card className="border-2 border-slate-200 hover:border-blue-500 hover:shadow-2xl transition-all duration-300" data-aos="fade-right">
              <CardContent className="p-10">
                <div className="text-center mb-8">
                  <div className="w-16 h-16 bg-slate-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
                    <Zap className="w-8 h-8 text-slate-600" />
                  </div>
                  <h2 className="text-3xl font-bold text-slate-900 mb-4">Free</h2>
                  <div className="text-5xl font-bold text-blue-600 mb-2">$0</div>
                  <p className="text-slate-600">Forever free to get started</p>
                </div>
                
                <ul className="space-y-4 mb-10">
                  <li className="flex items-start gap-3">
                    <CheckCircle2 className="w-6 h-6 text-green-600 flex-shrink-0 mt-0.5" />
                    <span className="text-slate-700"><strong>2 certificate groups</strong> maximum</span>
                  </li>
                  <li className="flex items-start gap-3">
                    <CheckCircle2 className="w-6 h-6 text-green-600 flex-shrink-0 mt-0.5" />
                    <span className="text-slate-700"><strong>5 mint credits</strong> included</span>
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
                    <span className="text-slate-700">Blockchain minting on Polygon</span>
                  </li>
                  <li className="flex items-start gap-3">
                    <X className="w-6 h-6 text-red-400 flex-shrink-0 mt-0.5" />
                    <span className="text-slate-500">Cannot purchase additional credits</span>
                  </li>
                  <li className="flex items-start gap-3">
                    <X className="w-6 h-6 text-red-400 flex-shrink-0 mt-0.5" />
                    <span className="text-slate-500">Limited to 2 groups</span>
                  </li>
                </ul>
                
                {subscriptionStatus?.subscription_type === 'free' ? (
                  <Button disabled className="w-full py-6 text-lg rounded-xl border-2" variant="outline">
                    Current Plan
                  </Button>
                ) : (
                  <Link to="/signup" className="block">
                    <Button className="w-full py-6 text-lg rounded-xl border-2" variant="outline">
                      Get Started Free
                    </Button>
                  </Link>
                )}
              </CardContent>
            </Card>
            
            {/* Pro Plan */}
            <Card className="border-2 border-purple-500 bg-gradient-to-br from-purple-50 to-white relative overflow-hidden shadow-2xl" data-aos="fade-left">
              <div className="absolute top-0 right-0 bg-purple-600 text-white px-6 py-2 rounded-bl-2xl text-sm font-bold">
                RECOMMENDED
              </div>
              <CardContent className="p-10">
                <div className="text-center mb-8">
                  <div className="w-16 h-16 bg-purple-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
                    <Crown className="w-8 h-8 text-purple-600" />
                  </div>
                  <h2 className="text-3xl font-bold text-slate-900 mb-4">Pro</h2>
                  <div className="text-5xl font-bold text-purple-600 mb-2">
                    $29
                    <span className="text-xl text-slate-600">/month</span>
                  </div>
                  <p className="text-slate-600">For professionals & organizations</p>
                </div>
                
                <ul className="space-y-4 mb-10">
                  <li className="flex items-start gap-3">
                    <CheckCircle2 className="w-6 h-6 text-green-600 flex-shrink-0 mt-0.5" />
                    <span className="text-slate-700"><strong>Unlimited groups</strong> while subscribed</span>
                  </li>
                  <li className="flex items-start gap-3">
                    <CheckCircle2 className="w-6 h-6 text-green-600 flex-shrink-0 mt-0.5" />
                    <span className="text-slate-700"><strong>Purchase mint credits</strong> as needed</span>
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
                
                {subscriptionStatus?.is_pro ? (
                  <Button disabled className="w-full bg-purple-600 text-white py-6 text-lg rounded-xl">
                    ✓ Current Plan
                  </Button>
                ) : (
                  <Button 
                    onClick={handleUpgradeToPro}
                    disabled={loading}
                    className="w-full bg-purple-600 hover:bg-purple-700 text-white py-6 text-lg rounded-xl shadow-lg hover:shadow-xl transition-all duration-300"
                  >
                    {loading ? 'Processing...' : (
                      <>
                        Upgrade to Pro
                        <ArrowRight className="ml-2 w-5 h-5" />
                      </>
                    )}
                  </Button>
                )}
              </CardContent>
            </Card>
          </div>
          
          {/* Mint Credit Packages */}
          <div className="max-w-5xl mx-auto" data-aos="fade-up">
            <div className="text-center mb-12">
              <h2 className="text-4xl font-bold text-slate-900 mb-4">Mint Credit Packages</h2>
              <p className="text-xl text-slate-600">
                {subscriptionStatus?.is_pro 
                  ? "Purchase credits to mint certificates. 1 credit = 1 certificate minted."
                  : "Upgrade to Pro to purchase additional mint credits."}
              </p>
            </div>
            
            <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
              {creditPackages.map((pkg) => (
                <Card 
                  key={pkg.id}
                  className={`relative cursor-pointer transition-all duration-300 hover:shadow-lg ${
                    pkg.popular ? 'border-2 border-purple-500 ring-2 ring-purple-100' : 'border border-slate-200'
                  } ${selectedPackage === pkg.id ? 'ring-2 ring-blue-500' : ''}`}
                  onClick={() => setSelectedPackage(pkg.id)}
                >
                  {pkg.popular && (
                    <div className="absolute -top-3 left-1/2 transform -translate-x-1/2">
                      <Badge className="bg-purple-600 text-white">Best Value</Badge>
                    </div>
                  )}
                  <CardContent className="p-6 text-center">
                    <h3 className="font-bold text-slate-900 mb-2">{pkg.name}</h3>
                    <div className="text-3xl font-bold text-purple-600 mb-1">{pkg.credits}</div>
                    <div className="text-sm text-slate-500 mb-4">credits</div>
                    <div className="text-2xl font-bold text-slate-900">${pkg.price}</div>
                    <div className="text-xs text-slate-500 mt-1">
                      ${(pkg.price / pkg.credits).toFixed(2)}/credit
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
            
            <div className="mt-8 text-center">
              {subscriptionStatus?.is_pro ? (
                <Button
                  onClick={() => selectedPackage && handlePurchaseCredits(selectedPackage)}
                  disabled={!selectedPackage || loading}
                  className="bg-purple-600 hover:bg-purple-700 text-white px-12 py-6 text-lg rounded-xl"
                >
                  {loading ? 'Processing...' : (
                    <>
                      <ShoppingCart className="w-5 h-5 mr-2" />
                      Purchase {selectedPackage ? creditPackages.find(p => p.id === selectedPackage)?.credits : ''} Credits
                    </>
                  )}
                </Button>
              ) : (
                <div className="bg-slate-100 rounded-xl p-6">
                  <p className="text-slate-600 mb-4">
                    Credit purchases are only available for Pro subscribers.
                  </p>
                  <Button 
                    onClick={handleUpgradeToPro}
                    disabled={loading}
                    className="bg-purple-600 hover:bg-purple-700 text-white"
                  >
                    Upgrade to Pro First
                  </Button>
                </div>
              )}
            </div>
          </div>
          
          {/* FAQ Section */}
          <div className="mt-20 max-w-3xl mx-auto" data-aos="fade-up">
            <h2 className="text-3xl font-bold text-slate-900 text-center mb-12">Frequently Asked Questions</h2>
            <div className="space-y-6">
              <Card>
                <CardContent className="p-6">
                  <h3 className="font-bold text-lg text-slate-900 mb-2">What is a mint credit?</h3>
                  <p className="text-slate-600">1 mint credit = 1 blockchain certificate minted. Each time you mint a certificate as an NFT, 1 credit is deducted from your balance.</p>
                </CardContent>
              </Card>
              
              <Card>
                <CardContent className="p-6">
                  <h3 className="font-bold text-lg text-slate-900 mb-2">What are the Free plan limits?</h3>
                  <p className="text-slate-600">Free users can create up to 2 groups and get 5 mint credits. These credits cannot be replenished without upgrading to Pro.</p>
                </CardContent>
              </Card>
              
              <Card>
                <CardContent className="p-6">
                  <h3 className="font-bold text-lg text-slate-900 mb-2">Do credits expire?</h3>
                  <p className="text-slate-600">No! Your mint credits never expire. Even if your Pro subscription ends, any remaining credits stay in your account.</p>
                </CardContent>
              </Card>
              
              <Card>
                <CardContent className="p-6">
                  <h3 className="font-bold text-lg text-slate-900 mb-2">Can I downgrade from Pro to Free?</h3>
                  <p className="text-slate-600">Yes, your Pro subscription will simply not renew. You'll keep any remaining credits, but won't be able to purchase more or create new groups beyond the Free limit of 2.</p>
                </CardContent>
              </Card>
              
              <Card>
                <CardContent className="p-6">
                  <h3 className="font-bold text-lg text-slate-900 mb-2">What happens when I run out of credits?</h3>
                  <p className="text-slate-600">Pro users can purchase more credits anytime. Free users will need to upgrade to Pro to continue minting certificates.</p>
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

export default PricingPage;
