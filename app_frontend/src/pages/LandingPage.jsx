import React from 'react';
import { Link } from 'react-router-dom';
import { Shield, Award, Users, Sparkles, CheckCircle2, ArrowRight, Zap, Lock, Globe } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { LandingHeader } from '@/components/LandingHeader';
import { Footer } from '@/components/Footer';

export const LandingPage = () => {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-slate-100">
      <LandingHeader />
      
      {/* Hero Section */}
      <section className="relative pt-32 pb-20 px-4 overflow-hidden">
        <div className="absolute inset-0 opacity-10">
          <div className="absolute top-20 left-10 w-72 h-72 bg-blue-400 rounded-full blur-3xl animate-pulse-slow"></div>
          <div className="absolute bottom-20 right-10 w-96 h-96 bg-purple-400 rounded-full blur-3xl animate-pulse-slow"></div>
        </div>
        
        <div className="container mx-auto max-w-6xl relative z-10">
          <div className="grid md:grid-cols-2 gap-12 items-center">
            <div data-aos="fade-right">
              <div className="inline-block mb-4 px-4 py-2 bg-blue-100 text-blue-800 rounded-full text-sm font-medium">
                <Sparkles className="inline w-4 h-4 mr-2" />
                Blockchain-Powered Certificates
              </div>
              <h1 className="text-5xl lg:text-6xl font-bold text-slate-900 mb-6 leading-tight">
                Create & Issue
                <span className="block text-blue-600">Digital Certificates</span>
                with Ease
              </h1>
              <p className="text-lg text-slate-600 mb-8 leading-relaxed">
                Transform how you issue credentials. CertiChain brings blockchain security, 
                beautiful templates, and seamless verification to your certification process.
              </p>
              <div className="flex flex-wrap gap-4">
                <Link to="/signup">
                  <Button size="lg" className="bg-blue-600 hover:bg-blue-700 text-white px-8 py-6 text-lg rounded-xl shadow-lg hover:shadow-xl transition-all duration-300">
                    Get Started Free
                    <ArrowRight className="ml-2 w-5 h-5" />
                  </Button>
                </Link>
                <Link to="/pricing">
                  <Button size="lg" variant="outline" className="border-2 border-slate-300 hover:border-blue-600 hover:text-blue-600 px-8 py-6 text-lg rounded-xl transition-all duration-300">
                    View Pricing
                  </Button>
                </Link>
              </div>
            </div>
            
            <div data-aos="fade-left" className="relative">
              <div className="relative z-10 glass-effect rounded-2xl p-8 shadow-2xl">
                <div className="bg-white rounded-xl p-6 shadow-md">
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-3">
                      <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
                        <Award className="w-6 h-6 text-blue-600" />
                      </div>
                      <div>
                        <h3 className="font-semibold text-slate-900">Certificate of Achievement</h3>
                        <p className="text-sm text-slate-500">Issued by CertiChain</p>
                      </div>
                    </div>
                  </div>
                  <div className="border-t border-slate-200 pt-4">
                    <div className="space-y-2">
                      <div className="flex justify-between">
                        <span className="text-slate-600">Recipient:</span>
                        <span className="font-medium text-slate-900">John Doe</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-slate-600">Course:</span>
                        <span className="font-medium text-slate-900">Web Development</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-slate-600">Status:</span>
                        <span className="flex items-center gap-1 text-green-600 font-medium">
                          <CheckCircle2 className="w-4 h-4" />
                          Verified
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
              <div className="absolute -top-4 -right-4 w-24 h-24 bg-yellow-300 rounded-full blur-2xl opacity-60 animate-float"></div>
              <div className="absolute -bottom-4 -left-4 w-32 h-32 bg-blue-300 rounded-full blur-2xl opacity-60 animate-float" style={{animationDelay: '1s'}}></div>
            </div>
          </div>
        </div>
      </section>

      {/* How It Works Section */}
      <section className="py-20 px-4 bg-white">
        <div className="container mx-auto max-w-6xl">
          <div className="text-center mb-16" data-aos="fade-up">
            <h2 className="text-4xl lg:text-5xl font-bold text-slate-900 mb-4">How It Works</h2>
            <p className="text-lg text-slate-600">Three simple steps to start issuing certificates</p>
          </div>
          
          <div className="grid md:grid-cols-3 gap-8">
            <Card className="border-2 border-slate-200 hover:border-blue-500 hover:shadow-xl transition-all duration-300" data-aos="fade-up" data-aos-delay="100">
              <CardContent className="p-8">
                <div className="w-16 h-16 bg-blue-100 rounded-2xl flex items-center justify-center mb-6">
                  <Users className="w-8 h-8 text-blue-600" />
                </div>
                <div className="text-3xl font-bold text-blue-600 mb-3">01</div>
                <h3 className="text-xl font-bold text-slate-900 mb-3">Create a Group</h3>
                <p className="text-slate-600 leading-relaxed">Set up your certificate group with course details and the number of learners.</p>
              </CardContent>
            </Card>
            
            <Card className="border-2 border-slate-200 hover:border-blue-500 hover:shadow-xl transition-all duration-300" data-aos="fade-up" data-aos-delay="200">
              <CardContent className="p-8">
                <div className="w-16 h-16 bg-purple-100 rounded-2xl flex items-center justify-center mb-6">
                  <Sparkles className="w-8 h-8 text-purple-600" />
                </div>
                <div className="text-3xl font-bold text-purple-600 mb-3">02</div>
                <h3 className="text-xl font-bold text-slate-900 mb-3">Design Template</h3>
                <p className="text-slate-600 leading-relaxed">Upload your PDF background and customize with draggable fields.</p>
              </CardContent>
            </Card>
            
            <Card className="border-2 border-slate-200 hover:border-blue-500 hover:shadow-xl transition-all duration-300" data-aos="fade-up" data-aos-delay="300">
              <CardContent className="p-8">
                <div className="w-16 h-16 bg-green-100 rounded-2xl flex items-center justify-center mb-6">
                  <Award className="w-8 h-8 text-green-600" />
                </div>
                <div className="text-3xl font-bold text-green-600 mb-3">03</div>
                <h3 className="text-xl font-bold text-slate-900 mb-3">Issue Certificates</h3>
                <p className="text-slate-600 leading-relaxed">Share your unique link and let learners claim their certificates.</p>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-20 px-4 bg-slate-50">
        <div className="container mx-auto max-w-6xl">
          <div className="text-center mb-16" data-aos="fade-up">
            <h2 className="text-4xl lg:text-5xl font-bold text-slate-900 mb-4">Powerful Features</h2>
            <p className="text-lg text-slate-600">Everything you need for professional certification</p>
          </div>
          
          <div className="grid md:grid-cols-2 gap-8">
            <Card className="border-none shadow-lg hover:shadow-xl transition-shadow duration-300" data-aos="fade-right">
              <CardContent className="p-8">
                <div className="flex items-start gap-4">
                  <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center flex-shrink-0">
                    <Zap className="w-6 h-6 text-blue-600" />
                  </div>
                  <div>
                    <h3 className="text-xl font-bold text-slate-900 mb-2">Auto Minting</h3>
                    <p className="text-slate-600">Certificates are automatically minted on blockchain when claimed by learners.</p>
                  </div>
                </div>
              </CardContent>
            </Card>
            
            <Card className="border-none shadow-lg hover:shadow-xl transition-shadow duration-300" data-aos="fade-left">
              <CardContent className="p-8">
                <div className="flex items-start gap-4">
                  <div className="w-12 h-12 bg-green-100 rounded-xl flex items-center justify-center flex-shrink-0">
                    <Shield className="w-6 h-6 text-green-600" />
                  </div>
                  <div>
                    <h3 className="text-xl font-bold text-slate-900 mb-2">QR Verification</h3>
                    <p className="text-slate-600">Every certificate includes a QR code for instant verification and authenticity.</p>
                  </div>
                </div>
              </CardContent>
            </Card>
            
            <Card className="border-none shadow-lg hover:shadow-xl transition-shadow duration-300" data-aos="fade-right">
              <CardContent className="p-8">
                <div className="flex items-start gap-4">
                  <div className="w-12 h-12 bg-purple-100 rounded-xl flex items-center justify-center flex-shrink-0">
                    <Users className="w-6 h-6 text-purple-600" />
                  </div>
                  <div>
                    <h3 className="text-xl font-bold text-slate-900 mb-2">Group-Based Issuing</h3>
                    <p className="text-slate-600">Organize certificates by groups for different courses or events easily.</p>
                  </div>
                </div>
              </CardContent>
            </Card>
            
            <Card className="border-none shadow-lg hover:shadow-xl transition-shadow duration-300" data-aos="fade-left">
              <CardContent className="p-8">
                <div className="flex items-start gap-4">
                  <div className="w-12 h-12 bg-orange-100 rounded-xl flex items-center justify-center flex-shrink-0">
                    <Globe className="w-6 h-6 text-orange-600" />
                  </div>
                  <div>
                    <h3 className="text-xl font-bold text-slate-900 mb-2">Template Designer</h3>
                    <p className="text-slate-600">Intuitive drag-and-drop interface to create beautiful certificate templates.</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* Pricing Preview Section */}
      <section className="py-20 px-4 bg-white">
        <div className="container mx-auto max-w-6xl">
          <div className="text-center mb-16" data-aos="fade-up">
            <h2 className="text-4xl lg:text-5xl font-bold text-slate-900 mb-4">Simple Pricing</h2>
            <p className="text-lg text-slate-600">Choose the plan that fits your needs</p>
          </div>
          
          <div className="grid md:grid-cols-2 gap-8 max-w-4xl mx-auto">
            <Card className="border-2 border-slate-200 hover:border-blue-500 transition-all duration-300" data-aos="fade-up" data-aos-delay="100">
              <CardContent className="p-8">
                <div className="text-center mb-6">
                  <h3 className="text-2xl font-bold text-slate-900 mb-2">Starter</h3>
                  <div className="text-4xl font-bold text-blue-600 mb-2">Free</div>
                  <p className="text-slate-600">Perfect for getting started</p>
                </div>
                <ul className="space-y-3 mb-8">
                  <li className="flex items-center gap-2">
                    <CheckCircle2 className="w-5 h-5 text-green-600" />
                    <span className="text-slate-700">Up to 50 learners</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle2 className="w-5 h-5 text-green-600" />
                    <span className="text-slate-700">1 certificate group</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle2 className="w-5 h-5 text-green-600" />
                    <span className="text-slate-700">Basic template designer</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle2 className="w-5 h-5 text-green-600" />
                    <span className="text-slate-700">QR verification</span>
                  </li>
                </ul>
                <Link to="/signup">
                  <Button className="w-full py-6 text-lg rounded-xl" variant="outline">
                    Get Started
                  </Button>
                </Link>
              </CardContent>
            </Card>
            
            <Card className="border-2 border-blue-500 bg-blue-50 relative overflow-hidden transition-all duration-300" data-aos="fade-up" data-aos-delay="200">
              <div className="absolute top-4 right-4 bg-blue-600 text-white px-3 py-1 rounded-full text-sm font-medium">
                Popular
              </div>
              <CardContent className="p-8">
                <div className="text-center mb-6">
                  <h3 className="text-2xl font-bold text-slate-900 mb-2">Pro</h3>
                  <div className="text-4xl font-bold text-blue-600 mb-2">$29<span className="text-lg text-slate-600">/mo</span></div>
                  <p className="text-slate-600">For professionals & teams</p>
                </div>
                <ul className="space-y-3 mb-8">
                  <li className="flex items-center gap-2">
                    <CheckCircle2 className="w-5 h-5 text-green-600" />
                    <span className="text-slate-700">Unlimited learners</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle2 className="w-5 h-5 text-green-600" />
                    <span className="text-slate-700">Unlimited groups</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle2 className="w-5 h-5 text-green-600" />
                    <span className="text-slate-700">Advanced template designer</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle2 className="w-5 h-5 text-green-600" />
                    <span className="text-slate-700">Priority support</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle2 className="w-5 h-5 text-green-600" />
                    <span className="text-slate-700">Custom branding</span>
                  </li>
                </ul>
                <Link to="/pricing">
                  <Button className="w-full bg-blue-600 hover:bg-blue-700 text-white py-6 text-lg rounded-xl shadow-lg hover:shadow-xl transition-all duration-300">
                    View Details
                  </Button>
                </Link>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 px-4 bg-gradient-to-br from-blue-600 to-blue-800 text-white">
        <div className="container mx-auto max-w-4xl text-center" data-aos="zoom-in">
          <h2 className="text-4xl lg:text-5xl font-bold mb-6">Ready to Get Started?</h2>
          <p className="text-xl mb-8 text-blue-100">Join thousands of educators and organizations using CertiChain</p>
          <Link to="/signup">
            <Button size="lg" className="bg-white text-blue-600 hover:bg-blue-50 px-8 py-6 text-lg rounded-xl shadow-lg hover:shadow-xl transition-all duration-300">
              Create Your Free Account
              <ArrowRight className="ml-2 w-5 h-5" />
            </Button>
          </Link>
        </div>
      </section>

      <Footer />
    </div>
  );
};
