import React, { useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { Award, CheckCircle2, Download, Share2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent } from '@/components/ui/card';

export const ClaimPage = () => {
  const { joinCode } = useParams();
  const [submitted, setSubmitted] = useState(false);
  
  // Static mock data
  const groupData = {
    name: 'Web Development Bootcamp 2025',
    issuer: 'Tech Academy',
    description: 'Comprehensive web development program',
  };
  
  if (submitted) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-slate-100 flex items-center justify-center px-4">
        <Card className="max-w-2xl w-full border-none shadow-2xl" data-aos="zoom-in">
          <CardContent className="p-12 text-center">
            <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
              <CheckCircle2 className="w-12 h-12 text-green-600" />
            </div>
            
            <h1 className="text-4xl font-bold text-slate-900 mb-4">Certificate Minted Successfully!</h1>
            <p className="text-lg text-slate-600 mb-8">Your certificate has been issued and verified on the blockchain</p>
            
            {/* Certificate Preview */}
            <div className="bg-slate-100 rounded-xl p-8 mb-8">
              <div className="bg-white rounded-lg p-8 shadow-lg">
                <div className="text-center">
                  <div className="w-16 h-16 bg-blue-600 rounded-full flex items-center justify-center mx-auto mb-4">
                    <Award className="w-10 h-10 text-white" />
                  </div>
                  <h2 className="text-3xl font-bold text-slate-900 mb-2">Certificate of Completion</h2>
                  <p className="text-slate-600 mb-6">{groupData.name}</p>
                  <div className="border-t border-b border-slate-200 py-6 my-6">
                    <p className="text-2xl font-bold text-slate-900">John Doe</p>
                    <p className="text-slate-600">john@example.com</p>
                  </div>
                  <p className="text-sm text-slate-500">Issued by {groupData.issuer}</p>
                  <p className="text-sm text-slate-500">{new Date().toLocaleDateString()}</p>
                </div>
              </div>
            </div>
            
            <div className="flex flex-wrap gap-4 justify-center">
              <Button className="bg-blue-600 hover:bg-blue-700 text-white px-8 py-6 rounded-xl shadow-lg">
                <Download className="w-5 h-5 mr-2" />
                Download Certificate
              </Button>
              <Button variant="outline" className="border-2 px-8 py-6 rounded-xl">
                <Share2 className="w-5 h-5 mr-2" />
                Share
              </Button>
            </div>
            
            <div className="mt-8 pt-8 border-t border-slate-200">
              <Link to="/dashboard" className="text-blue-600 hover:text-blue-700 font-medium">
                Go to Dashboard →
              </Link>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }
  
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-slate-100 flex items-center justify-center px-4 py-12">
      <div className="max-w-2xl w-full">
        {/* Header */}
        <div className="text-center mb-8" data-aos="fade-down">
          <Link to="/" className="inline-flex items-center gap-2 mb-6 group">
            <div className="w-12 h-12 bg-blue-600 rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform duration-300">
              <Award className="w-7 h-7 text-white" />
            </div>
            <span className="text-3xl font-bold text-slate-900">CertiChain</span>
          </Link>
        </div>
        
        {/* Group Info Card */}
        <Card className="mb-6 border-none shadow-xl" data-aos="fade-up">
          <CardContent className="p-8">
            <div className="flex items-start gap-4">
              <div className="w-16 h-16 bg-blue-100 rounded-xl flex items-center justify-center flex-shrink-0">
                <Award className="w-8 h-8 text-blue-600" />
              </div>
              <div>
                <h2 className="text-2xl font-bold text-slate-900 mb-2">{groupData.name}</h2>
                <p className="text-slate-600 mb-1">{groupData.description}</p>
                <p className="text-sm text-slate-500">Issued by {groupData.issuer}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        {/* Claim Form */}
        <Card className="border-none shadow-2xl" data-aos="fade-up" data-aos-delay="100">
          <CardContent className="p-8">
            <h1 className="text-3xl font-bold text-slate-900 mb-2">Claim Your Certificate</h1>
            <p className="text-slate-600 mb-8">Fill in your details to receive your certificate</p>
            
            <form className="space-y-6" onSubmit={(e) => { e.preventDefault(); setSubmitted(true); }}>
              <div>
                <Label htmlFor="name" className="text-slate-700 font-medium mb-2 block">Full Name</Label>
                <Input
                  id="name"
                  type="text"
                  placeholder="Enter your full name"
                  className="py-6 text-lg rounded-xl border-slate-300 focus:border-blue-500"
                  required
                  data-testid="claim-name-input"
                />
              </div>
              
              <div>
                <Label htmlFor="email" className="text-slate-700 font-medium mb-2 block">Email Address</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="your@email.com"
                  className="py-6 text-lg rounded-xl border-slate-300 focus:border-blue-500"
                  required
                  data-testid="claim-email-input"
                />
              </div>
              
              <div>
                <Label htmlFor="studentId" className="text-slate-700 font-medium mb-2 block">Student ID (Optional)</Label>
                <Input
                  id="studentId"
                  type="text"
                  placeholder="Enter student ID if applicable"
                  className="py-6 text-lg rounded-xl border-slate-300 focus:border-blue-500"
                  data-testid="claim-studentid-input"
                />
              </div>
              
              <div className="bg-blue-50 rounded-xl p-4 border border-blue-200">
                <p className="text-sm text-slate-700">
                  <strong>Note:</strong> Your certificate will be minted on the blockchain and cannot be modified once issued. Please ensure all information is correct.
                </p>
              </div>
              
              <Button
                type="submit"
                className="w-full bg-blue-600 hover:bg-blue-700 text-white py-6 text-lg rounded-xl shadow-lg hover:shadow-xl transition-all duration-300"
                data-testid="claim-submit-button"
              >
                Claim Certificate
              </Button>
            </form>
          </CardContent>
        </Card>
        
        <div className="text-center mt-6 text-slate-600">
          <p className="text-sm">Join Code: <span className="font-mono font-bold text-slate-900">{joinCode}</span></p>
        </div>
      </div>
    </div>
  );
};