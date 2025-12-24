import React, { useState } from 'react';
import { ArrowRight, Link2, Hash, Award, Users, Calendar, CheckCircle2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';
import { supabase } from '@/supabaseClient';
import { toast } from 'sonner';
import { useParams } from 'react-router-dom';

export const JoinGroupPage = () => {
  const { joinCode: paramJoinCode } = useParams();
  const [joinCode, setJoinCode] = useState(paramJoinCode || '');

  const [loading, setLoading] = useState(false);

  const handleJoin = async () => {
    if (!joinCode.trim()) {
      toast.error('Please enter a join code');
      return;
    }

    if (joinCode.length !== 8) {
      toast.error('Join code must be 8 characters');
      return;
    }

    setLoading(true);

    try {
      // Verify the join code exists and get group
      const { data: group, error: groupError } = await supabase
        .from('groups')
        .select('*')
        .eq('join_code', joinCode.toUpperCase())
        .eq('status', 'active')
        .single();

      if (groupError || !group) {
        toast.error('Invalid or inactive join code');
        setLoading(false);
        return;
      }

      // Navigate to student group view
      window.location.href = `/student/group/${group.id}`;
    } catch (err) {
      console.error('Join error:', err);
      toast.error('Failed to join group');
      setLoading(false);
    }
  };

  const handlePaste = async () => {
    try {
      const text = await navigator.clipboard.readText();
      // Extract code from URL if pasted
      const match = text.match(/\/join\/([A-Z0-9]{8})/);
      if (match) {
        setJoinCode(match[1]);
      } else {
        setJoinCode(text.trim().toUpperCase());
      }
      toast.success('Pasted!');
    } catch (err) {
      console.error('Failed to read clipboard', err);
      toast.error('Failed to paste from clipboard');
    }
  };

  const handleSignIn = () => {
    window.location.href = '/login';
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50">
      {/* Header */}
      <header className="bg-white border-b border-slate-200 shadow-sm">
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-blue-600 rounded-xl flex items-center justify-center">
              <Award className="w-6 h-6 text-white" />
            </div>
            <h1 className="text-2xl font-bold text-slate-900">CertiChain</h1>
          </div>
          <Button
            variant="ghost"
            onClick={handleSignIn}
            className="text-slate-600 hover:text-slate-900"
          >
            Sign In
          </Button>
        </div>
      </header>

      {/* Main Content */}
      <div className="max-w-2xl mx-auto px-6 py-20">
        <div className="text-center mb-12">
          <div className="w-20 h-20 bg-gradient-to-br from-blue-600 to-purple-600 rounded-2xl flex items-center justify-center mx-auto mb-6 shadow-lg">
            <Users className="w-10 h-10 text-white" />
          </div>
          <h2 className="text-4xl font-bold text-slate-900 mb-4">
            Join a Certificate Group
          </h2>
          <p className="text-lg text-slate-600">
            Enter your join code or paste the invitation link to claim your certificate
          </p>
        </div>

        <Card className="shadow-xl border-2 border-slate-200">
          <CardContent className="p-8 space-y-6">
            {/* Join Code Input */}
            <div>
              <label className="text-sm font-semibold text-slate-700 mb-3 flex items-center gap-2">
                <Hash className="w-4 h-4" />
                Join Code
              </label>
              <div className="flex gap-3">
                <Input
                  placeholder="Enter 8-character code (e.g., ABC12XYZ)"
                  value={joinCode}
                  onChange={(e) => setJoinCode(e.target.value.toUpperCase())}
                  onKeyPress={(e) => e.key === 'Enter' && handleJoin()}
                  className="text-lg font-mono py-6 rounded-xl"
                  maxLength={8}
                />
                <Button
                  onClick={handlePaste}
                  variant="outline"
                  className="px-6 rounded-xl"
                >
                  Paste
                </Button>
              </div>
            </div>

            {/* Divider */}
            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-slate-300"></div>
              </div>
              <div className="relative flex justify-center text-sm">
                <span className="px-4 bg-white text-slate-500">OR</span>
              </div>
            </div>

            {/* Link Input */}
            <div>
              <label className="text-sm font-semibold text-slate-700 mb-3 flex items-center gap-2">
                <Link2 className="w-4 h-4" />
                Invitation Link
              </label>
              <Input
                placeholder="Paste invitation link here..."
                onChange={(e) => {
                  const match = e.target.value.match(/\/join\/([A-Z0-9]{8})/);
                  if (match) setJoinCode(match[1]);
                }}
                className="text-lg py-6 rounded-xl"
              />
            </div>

            {/* Join Button */}
            <Button
              onClick={handleJoin}
              disabled={loading || joinCode.length !== 8}
              className="w-full bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white py-7 rounded-xl text-lg font-semibold shadow-lg disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? (
                <div className="flex items-center justify-center">
                  <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></div>
                  Validating...
                </div>
              ) : (
                <>
                  Join Group
                  <ArrowRight className="ml-2 w-5 h-5" />
                </>
              )}
            </Button>
          </CardContent>
        </Card>

        {/* Info Cards */}
        <div className="grid md:grid-cols-3 gap-4 mt-12">
          <Card className="bg-white border-slate-200">
            <CardContent className="p-6 text-center">
              <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center mx-auto mb-3">
                <CheckCircle2 className="w-6 h-6 text-blue-600" />
              </div>
              <h3 className="font-semibold text-slate-900 mb-1">Verified</h3>
              <p className="text-sm text-slate-600">Blockchain secured certificates</p>
            </CardContent>
          </Card>

          <Card className="bg-white border-slate-200">
            <CardContent className="p-6 text-center">
              <div className="w-12 h-12 bg-purple-100 rounded-xl flex items-center justify-center mx-auto mb-3">
                <Award className="w-6 h-6 text-purple-600" />
              </div>
              <h3 className="font-semibold text-slate-900 mb-1">Instant</h3>
              <p className="text-sm text-slate-600">Claim your certificate instantly</p>
            </CardContent>
          </Card>

          <Card className="bg-white border-slate-200">
            <CardContent className="p-6 text-center">
              <div className="w-12 h-12 bg-green-100 rounded-xl flex items-center justify-center mx-auto mb-3">
                <Calendar className="w-6 h-6 text-green-600" />
              </div>
              <h3 className="font-semibold text-slate-900 mb-1">Forever</h3>
              <p className="text-sm text-slate-600">Access anytime, anywhere</p>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default JoinGroupPage;