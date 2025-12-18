import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Plus, Users, Award, Calendar, MoreVertical } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import DashboardLayout from '@/components/DashboardLayout';
import { supabase } from "@/supabaseClient";

export const DashboardPage = () => {

  const [myGroups, setMyGroups] = useState([]);
  const [obtainedCertificates, setObtainedCertificates] = useState([]);

  useEffect(() => {
    const loadGroups = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      const user = session?.user;
      if (!user) return;

      const { data, error } = await supabase
        .from("groups")
        .select("*")
        .eq("created_by", user.id)
        .order("created_at", { ascending: false });

      if (!error) setMyGroups(data);
    };

    loadGroups();
  }, []);

  useEffect(() => {
    const loadCertificates = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      const user = session?.user;
      if (!user) return;

      const { data, error } = await supabase
        .from("certificates")
        .select("*")
        .eq("claimed_by", user.id)
        .order("claimed_at", { ascending: false });

      if (!error) setObtainedCertificates(data);
    };

    loadCertificates();
  }, []);

  return (
    <DashboardLayout>
      <div className="space-y-8">

        {/* HEADER */}
        <div data-aos="fade-down">
          <h1 className="text-4xl font-bold text-slate-900 mb-2">Dashboard</h1>
          <p className="text-slate-600">Manage your certificate groups and view your achievements</p>
        </div>

        {/* QUICK ACTIONS */}
        <div className="grid md:grid-cols-2 gap-6" data-aos="fade-up">

          {/* Create Certificate */}
          <Card className="border-2 border-dashed border-slate-300 hover:border-blue-500 hover:shadow-lg transition-all duration-300 cursor-pointer group">
            <Link to="/dashboard/create-certificate">
              <CardContent className="p-8 flex flex-col items-center justify-center text-center min-h-[200px]">
                <div className="w-16 h-16 bg-blue-100 rounded-2xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform duration-300">
                  <Plus className="w-8 h-8 text-blue-600" />
                </div>
                <h3 className="text-xl font-bold text-slate-900 mb-2">Create New Certificate</h3>
                <p className="text-slate-600">Start issuing certificates to your learners</p>
              </CardContent>
            </Link>
          </Card>

          {/* Join Group */}
          <Card className="border-2 border-dashed border-slate-300 hover:border-green-500 hover:shadow-lg transition-all duration-300 cursor-pointer group">
            <CardContent className="p-8 flex flex-col items-center justify-center text-center min-h-[200px]">
              <div className="w-16 h-16 bg-green-100 rounded-2xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform duration-300">
                <Users className="w-8 h-8 text-green-600" />
              </div>
              <h3 className="text-xl font-bold text-slate-900 mb-2">Join a Group</h3>
              <p className="text-slate-600">Enter a join code to claim your certificate</p>
            </CardContent>
          </Card>

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
                    
                    {/* Group Name */}
                    <TableCell>
                      <Link
                        to={`/dashboard/my-groups/${group.id}`}
                        className="font-medium text-slate-900 hover:text-blue-600"
                      >
                        {group.name}
                      </Link>
                    </TableCell>

                    {/* Learner Count */}
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Users className="w-4 h-4 text-slate-400" />
                        <span className="text-slate-700">{group.learner_count || 0}</span>
                      </div>
                    </TableCell>

                    {/* Status */}
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

                    {/* Created Date */}
                    <TableCell>
                      <div className="flex items-center gap-2 text-slate-600">
                        <Calendar className="w-4 h-4" />
                        {new Date(group.created_at).toLocaleDateString()}
                      </div>
                    </TableCell>

                    {/* ACTION BUTTONS */}
                    <TableCell className="flex items-center gap-1">

                      {/* NEW — View Group Details */}
                      <Button
                        variant="ghost"
                        size="icon"
                        className="hover:bg-slate-100"
                        onClick={() => window.location.href = `/dashboard/my-groups/${group.id}`}
                      >
                        <Award className="w-4 h-4 text-blue-600" />
                      </Button>

                      {/* Existing Menu Button */}
                      <Button variant="ghost" size="icon" className="hover:bg-slate-100">
                        <MoreVertical className="w-4 h-4 text-slate-600" />
                      </Button>

                    </TableCell>

                  </TableRow>
                ))}
              </TableBody>

            </Table>
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
          </CardContent>
        </Card>

      </div>
    </DashboardLayout>
  );
};

export default DashboardPage;
