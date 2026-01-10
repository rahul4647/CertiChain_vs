import React, { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Plus, Users, Award, Calendar, MoreVertical, Zap, Crown, AlertTriangle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import DashboardLayout from '@/components/DashboardLayout';
import { supabase } from "@/supabaseClient";
import WalletConnect from '@/components/WalletConnect';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;

export const DashboardPage = () => {
  const navigate = useNavigate();
  const [myGroups, setMyGroups] = useState([]);
  const [obtainedCertificates, setObtainedCertificates] = useState([]);
  const [subscriptionStatus, setSubscriptionStatus] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadData = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      const user = session?.user;
      if (!user) {
        navigate('/login');
        return;
      }

      // Load groups
      const { data: groupsData, error: groupsError } = await supabase
        .from("groups")
        .select("*")
        .eq("created_by", user.id)
        .order("created_at", { ascending: false });

      if (!groupsError) setMyGroups(groupsData || []);

      // Load certificates
      const { data: certsData, error: certsError } = await supabase
        .from("certificates")
        .select("*")
        .eq("claimed_by", user.id)
        .order("claimed_at", { ascending: false });

      if (!certsError) setObtainedCertificates(certsData || []);

      // Load subscription status
      try {
        const res = await fetch(`${BACKEND_URL}/api/subscription/status/${user.id}`);
        if (res.ok) {
          const data = await res.json();
          setSubscriptionStatus(data);
        }
      } catch (err) {
        console.error('Failed to load subscription status:', err);
      }

      setLoading(false);
    };

    loadData();
  }, [navigate]);

  // Calculate progress percentages
  const groupsProgress = subscriptionStatus 
    ? subscriptionStatus.groups_limit === -1 
      ? 0 
      : (subscriptionStatus.groups_created / subscriptionStatus.groups_limit) * 100
    : 0;

  const creditsLow = subscriptionStatus && subscriptionStatus.mint_credits <= 2;

  return (
    <DashboardLayout>
      <div className="space-y-8">
        {/* HEADER */}
        <div data-aos="fade-down" className="flex items-center justify-between">
          <div>
            <h1 className="text-4xl font-bold text-slate-900 mb-2">Dashboard</h1>
            <p className="text-slate-600">Manage your certificate groups and view your achievements</p>
          </div>
          
          <div className="relative z-50">
            <WalletConnect />
          </div>
        </div>

        {/* SUBSCRIPTION STATUS CARD */}
        {subscriptionStatus && (
          <Card data-aos="fade-up" className={`border-2 ${subscriptionStatus.is_pro ? 'border-purple-200 bg-gradient-to-br from-purple-50 to-white' : 'border-slate-200'}`}>
            <CardContent className="p-6">
              <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-6">
                {/* Plan Info */}
                <div className="flex items-center gap-4">
                  <div className={`w-14 h-14 rounded-2xl flex items-center justify-center ${subscriptionStatus.is_pro ? 'bg-purple-100' : 'bg-slate-100'}`}>
                    {subscriptionStatus.is_pro ? (
                      <Crown className="w-7 h-7 text-purple-600" />
                    ) : (
                      <Zap className="w-7 h-7 text-slate-600" />
                    )}
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <h3 className="text-xl font-bold text-slate-900">
                        {subscriptionStatus.is_pro ? 'Pro Plan' : 'Free Plan'}
                      </h3>
                      <Badge className={subscriptionStatus.is_pro ? 'bg-purple-100 text-purple-800' : 'bg-slate-100 text-slate-800'}>
                        {subscriptionStatus.subscription_type.toUpperCase()}
                      </Badge>
                    </div>
                    {subscriptionStatus.is_pro && subscriptionStatus.subscription_expires_at && (
                      <p className="text-sm text-slate-500">
                        Expires: {new Date(subscriptionStatus.subscription_expires_at).toLocaleDateString()}
                      </p>
                    )}
                  </div>
                </div>

                {/* Stats */}
                <div className="flex flex-wrap gap-6">
                  {/* Mint Credits */}
                  <div className="min-w-[140px]">
                    <div className="flex items-center gap-2 mb-1">
                      <Zap className={`w-4 h-4 ${creditsLow ? 'text-orange-500' : 'text-yellow-500'}`} />
                      <span className="text-sm font-medium text-slate-600">Mint Credits</span>
                    </div>
                    <div className="flex items-baseline gap-1">
                      <span className={`text-3xl font-bold ${creditsLow ? 'text-orange-600' : 'text-slate-900'}`}>
                        {subscriptionStatus.mint_credits}
                      </span>
                      <span className="text-sm text-slate-500">remaining</span>
                    </div>
                    {creditsLow && (
                      <p className="text-xs text-orange-600 mt-1 flex items-center gap-1">
                        <AlertTriangle className="w-3 h-3" />
                        Running low!
                      </p>
                    )}
                  </div>

                  {/* Groups */}
                  <div className="min-w-[160px]">
                    <div className="flex items-center gap-2 mb-1">
                      <Users className="w-4 h-4 text-blue-500" />
                      <span className="text-sm font-medium text-slate-600">Groups</span>
                    </div>
                    <div className="flex items-baseline gap-1">
                      <span className="text-3xl font-bold text-slate-900">
                        {subscriptionStatus.groups_created}
                      </span>
                      <span className="text-sm text-slate-500">
                        / {subscriptionStatus.groups_limit === -1 ? '∞' : subscriptionStatus.groups_limit}
                      </span>
                    </div>
                    {!subscriptionStatus.is_pro && (
                      <Progress value={groupsProgress} className="h-1.5 mt-2" />
                    )}
                  </div>

                  {/* Certificates */}
                  <div className="min-w-[140px]">
                    <div className="flex items-center gap-2 mb-1">
                      <Award className="w-4 h-4 text-green-500" />
                      <span className="text-sm font-medium text-slate-600">Certificates</span>
                    </div>
                    <div className="flex items-baseline gap-1">
                      <span className="text-3xl font-bold text-slate-900">
                        {subscriptionStatus.total_certificates_issued}
                      </span>
                      <span className="text-sm text-slate-500">issued</span>
                    </div>
                  </div>
                </div>

                {/* CTA */}
                <div>
                  {subscriptionStatus.is_pro ? (
                    <Link to="/pricing">
                      <Button className="bg-purple-600 hover:bg-purple-700 text-white">
                        <Zap className="w-4 h-4 mr-2" />
                        Buy Credits
                      </Button>
                    </Link>
                  ) : (
                    <Link to="/pricing">
                      <Button className="bg-purple-600 hover:bg-purple-700 text-white">
                        <Crown className="w-4 h-4 mr-2" />
                        Upgrade to Pro
                      </Button>
                    </Link>
                  )}
                </div>
              </div>

              {/* Warning Messages */}
              {!subscriptionStatus.can_create_group && !subscriptionStatus.is_pro && (
                <div className="mt-4 p-3 bg-orange-50 border border-orange-200 rounded-lg flex items-center gap-3">
                  <AlertTriangle className="w-5 h-5 text-orange-600" />
                  <p className="text-sm text-orange-800">
                    You have reached the group limit for Free plan. <Link to="/pricing" className="font-medium underline">Upgrade to Pro</Link> for unlimited groups.
                  </p>
                </div>
              )}

              {!subscriptionStatus.can_mint && (
                <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-lg flex items-center gap-3">
                  <AlertTriangle className="w-5 h-5 text-red-600" />
                  <p className="text-sm text-red-800">
                    You have no mint credits remaining. <Link to="/pricing" className="font-medium underline">{subscriptionStatus.is_pro ? 'Purchase more credits' : 'Upgrade to Pro'}</Link> to continue minting certificates.
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        )}

        {/* QUICK ACTIONS */}
        <div className="grid md:grid-cols-2 gap-6" data-aos="fade-up">

          {/* Create Certificate */}
          <Card className={`border-2 border-dashed transition-all duration-300 cursor-pointer group ${
            subscriptionStatus?.can_create_group 
              ? 'border-slate-300 hover:border-blue-500 hover:shadow-lg' 
              : 'border-slate-200 bg-slate-50 opacity-60'
          }`}>
            {subscriptionStatus?.can_create_group ? (
              <Link to="/dashboard/create-certificate">
                <CardContent className="p-8 flex flex-col items-center justify-center text-center min-h-[200px]">
                  <div className="w-16 h-16 bg-blue-100 rounded-2xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform duration-300">
                    <Plus className="w-8 h-8 text-blue-600" />
                  </div>
                  <h3 className="text-xl font-bold text-slate-900 mb-2">Create New Certificate</h3>
                  <p className="text-slate-600">Start issuing certificates to your learners</p>
                  {!subscriptionStatus?.is_pro && (
                    <Badge className="mt-3 bg-slate-100 text-slate-600">
                      {subscriptionStatus.groups_created}/{subscriptionStatus.groups_limit} groups used
                    </Badge>
                  )}
                </CardContent>
              </Link>
            ) : (
              <CardContent className="p-8 flex flex-col items-center justify-center text-center min-h-[200px]">
                <div className="w-16 h-16 bg-slate-100 rounded-2xl flex items-center justify-center mb-4">
                  <Plus className="w-8 h-8 text-slate-400" />
                </div>
                <h3 className="text-xl font-bold text-slate-500 mb-2">Group Limit Reached</h3>
                <p className="text-slate-400 mb-4">Upgrade to Pro for unlimited groups</p>
                <Link to="/pricing">
                  <Button size="sm" className="bg-purple-600 hover:bg-purple-700 text-white">
                    <Crown className="w-4 h-4 mr-2" />
                    Upgrade Now
                  </Button>
                </Link>
              </CardContent>
            )}
          </Card>

          {/* Join Group */}
          <Link to="/join">
            <Card className="border-2 border-dashed border-slate-300 hover:border-green-500 hover:shadow-lg transition-all duration-300 cursor-pointer group">
              <CardContent className="p-8 flex flex-col items-center justify-center text-center min-h-[200px]">
                <div className="w-16 h-16 bg-green-100 rounded-2xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform duration-300">
                  <Users className="w-8 h-8 text-green-600" />
                </div>
                <h3 className="text-xl font-bold text-slate-900 mb-2">Join a Group</h3>
                <p className="text-slate-600">Enter a join code to claim your certificate</p>
              </CardContent>
            </Card>
          </Link>

        </div>

        {/* MY GROUPS */}
        <Card data-aos="fade-up" data-aos-delay="100">
          <CardHeader className="border-b border-slate-200 pb-4">
            <div className="flex items-center justify-between">
              <CardTitle className="text-2xl font-bold text-slate-900">My Groups</CardTitle>
              <Badge className="bg-blue-100 text-blue-800 hover:bg-blue-200">
                {myGroups.length} Groups
              </Badge>
            </div>
          </CardHeader>

          <CardContent className="p-0">
            {myGroups.length === 0 ? (
              <div className="p-12 text-center">
                <Users className="w-12 h-12 text-slate-300 mx-auto mb-4" />
                <p className="text-slate-500">You have not created any groups yet.</p>
                {subscriptionStatus?.can_create_group && (
                  <Link to="/dashboard/create-certificate">
                    <Button className="mt-4 bg-blue-600 hover:bg-blue-700 text-white">
                      Create Your First Group
                    </Button>
                  </Link>
                )}
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="font-semibold">Group Name</TableHead>
                    <TableHead className="font-semibold">Learners</TableHead>
                    <TableHead className="font-semibold">Status</TableHead>
                    <TableHead className="font-semibold">Created</TableHead>
                    <TableHead className="w-12"></TableHead>
                  </TableRow>
                </TableHeader>

                <TableBody>
                  {myGroups.map((group) => (
                    <TableRow key={group.id} className="hover:bg-slate-50 cursor-pointer">
                      
                      <TableCell>
                        <Link
                          to={`/dashboard/my-groups/${group.id}`}
                          className="font-medium text-slate-900 hover:text-blue-600"
                        >
                          {group.name}
                        </Link>
                      </TableCell>

                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Users className="w-4 h-4 text-slate-400" />
                          <span className="text-slate-700">{group.learner_count || 0}</span>
                        </div>
                      </TableCell>

                      <TableCell>
                        <Badge
                          className={
                            group.status === "active"
                              ? "bg-green-100 text-green-800 hover:bg-green-200"
                              : "bg-slate-100 text-slate-800 hover:bg-slate-200"
                          }
                        >
                          {group.status}
                        </Badge>
                      </TableCell>

                      <TableCell>
                        <div className="flex items-center gap-2 text-slate-600">
                          <Calendar className="w-4 h-4" />
                          {new Date(group.created_at).toLocaleDateString()}
                        </div>
                      </TableCell>

                      <TableCell className="flex items-center gap-1">
                        <Button
                          variant="ghost"
                          size="icon"
                          className="hover:bg-slate-100"
                          onClick={() => window.location.href = `/dashboard/my-groups/${group.id}`}
                        >
                          <Award className="w-4 h-4 text-blue-600" />
                        </Button>

                        <Button variant="ghost" size="icon" className="hover:bg-slate-100">
                          <MoreVertical className="w-4 h-4 text-slate-600" />
                        </Button>
                      </TableCell>

                    </TableRow>
                  ))}
                </TableBody>

              </Table>
            )}
          </CardContent>
        </Card>

        {/* CERTIFICATES OBTAINED */}
        <Card data-aos="fade-up" data-aos-delay="200">
          <CardHeader className="border-b border-slate-200 pb-4">
            <div className="flex items-center justify-between">
              <CardTitle className="text-2xl font-bold text-slate-900">Certificates Obtained</CardTitle>
              <Badge className="bg-purple-100 text-purple-800 hover:bg-purple-200">
                {obtainedCertificates.length} Certificates
              </Badge>
            </div>
          </CardHeader>

          <CardContent className="p-0">
            {obtainedCertificates.length === 0 ? (
              <div className="p-12 text-center">
                <Award className="w-12 h-12 text-slate-300 mx-auto mb-4" />
                <p className="text-slate-500">You have not received any certificates yet.</p>
                <Link to="/join">
                  <Button variant="outline" className="mt-4">
                    Join a Group
                  </Button>
                </Link>
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="font-semibold">Certificate Title</TableHead>
                    <TableHead className="font-semibold">Issued By</TableHead>
                    <TableHead className="font-semibold">Date Received</TableHead>
                    <TableHead className="w-12"></TableHead>
                  </TableRow>
                </TableHeader>

                <TableBody>
                  {obtainedCertificates.map((cert) => (
                    <TableRow key={cert.id} className="hover:bg-slate-50">
                      <TableCell>
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                            <Award className="w-5 h-5 text-blue-600" />
                          </div>
                          <span className="font-medium text-slate-900">{cert.title}</span>
                        </div>
                      </TableCell>

                      <TableCell className="text-slate-700">{cert.issuer_name}</TableCell>

                      <TableCell>
                        <div className="flex items-center gap-2 text-slate-600">
                          <Calendar className="w-4 h-4" />
                          {new Date(cert.claimed_at).toLocaleDateString()}
                        </div>
                      </TableCell>

                      <TableCell>
                        <Button variant="ghost" size="sm" className="text-blue-600 hover:text-blue-700 hover:bg-blue-50">
                          View
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>

              </Table>
            )}
          </CardContent>
        </Card>

      </div>
    </DashboardLayout>
  );
};

export default DashboardPage;
