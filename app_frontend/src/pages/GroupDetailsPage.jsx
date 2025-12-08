import React from 'react';
import { useParams, Link } from 'react-router-dom';
import { ArrowLeft, Users, Award, Calendar, Copy, ExternalLink, CheckCircle2, Clock } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import DashboardLayout from '@/components/DashboardLayout';
import { toast } from 'sonner';

export const GroupDetailsPage = () => {
  const { groupId } = useParams();
  
  // Static mock data
  const groupData = {
    id: groupId,
    name: 'Web Development Bootcamp 2025',
    description: 'Comprehensive web development program covering HTML, CSS, JavaScript, React, and Node.js',
    status: 'active',
    created: '2025-01-15',
    learnerCapacity: 50,
    mintedCertificates: 35,
    joinCode: 'WDB2025',
  };
  
  const issuedCertificates = [
    {
      id: '1',
      recipientName: 'Alice Johnson',
      recipientEmail: 'alice@example.com',
      issuedDate: '2025-01-20',
      status: 'verified',
    },
    {
      id: '2',
      recipientName: 'Bob Smith',
      recipientEmail: 'bob@example.com',
      issuedDate: '2025-01-21',
      status: 'verified',
    },
    {
      id: '3',
      recipientName: 'Carol Williams',
      recipientEmail: 'carol@example.com',
      issuedDate: '2025-01-22',
      status: 'pending',
    },
  ];
  
  const copyToClipboard = (text) => {
    navigator.clipboard.writeText(text);
    toast.success('Copied to clipboard!');
  };
  
  return (
    <DashboardLayout>
      <div className="max-w-6xl mx-auto space-y-8">
        {/* Header */}
        <div data-aos="fade-down">
          <Link to="/dashboard">
            <Button variant="ghost" className="mb-4 text-slate-600 hover:text-slate-900">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Dashboard
            </Button>
          </Link>
          
          <div className="flex items-start justify-between">
            <div>
              <h1 className="text-4xl font-bold text-slate-900 mb-2">{groupData.name}</h1>
              <p className="text-lg text-slate-600">{groupData.description}</p>
            </div>
            <Badge className={groupData.status === 'active' ? 'bg-green-100 text-green-800 text-lg px-4 py-2' : 'bg-slate-100 text-slate-800 text-lg px-4 py-2'}>
              {groupData.status}
            </Badge>
          </div>
        </div>
        
        {/* Stats Cards */}
        <div className="grid md:grid-cols-3 gap-6" data-aos="fade-up">
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-slate-600 mb-1">Learner Capacity</p>
                  <p className="text-3xl font-bold text-slate-900">{groupData.learnerCapacity}</p>
                </div>
                <div className="w-14 h-14 bg-blue-100 rounded-xl flex items-center justify-center">
                  <Users className="w-7 h-7 text-blue-600" />
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-slate-600 mb-1">Minted Certificates</p>
                  <p className="text-3xl font-bold text-slate-900">{groupData.mintedCertificates}</p>
                </div>
                <div className="w-14 h-14 bg-green-100 rounded-xl flex items-center justify-center">
                  <Award className="w-7 h-7 text-green-600" />
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-slate-600 mb-1">Created On</p>
                  <p className="text-3xl font-bold text-slate-900">{new Date(groupData.created).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}</p>
                </div>
                <div className="w-14 h-14 bg-purple-100 rounded-xl flex items-center justify-center">
                  <Calendar className="w-7 h-7 text-purple-600" />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
        
        {/* Join Code Section */}
        {groupData.status === 'active' && (
          <Card data-aos="fade-up" data-aos-delay="100" className="bg-gradient-to-br from-blue-50 to-white border-2 border-blue-200">
            <CardContent className="p-8">
              <h2 className="text-2xl font-bold text-slate-900 mb-6">Share with Learners</h2>
              <div className="grid md:grid-cols-2 gap-6">
                <div>
                  <label className="text-sm font-medium text-slate-700 mb-2 block">Join Code</label>
                  <div className="flex gap-2">
                    <Input
                      value={groupData.joinCode}
                      readOnly
                      className="font-mono text-lg font-bold rounded-xl"
                      data-testid="join-code-display"
                    />
                    <Button
                      onClick={() => copyToClipboard(groupData.joinCode)}
                      className="bg-blue-600 hover:bg-blue-700 text-white rounded-xl px-6"
                    >
                      <Copy className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
                
                <div>
                  <label className="text-sm font-medium text-slate-700 mb-2 block">Shareable Link</label>
                  <div className="flex gap-2">
                    <Input
                      value={`app.certichain.com/claim/${groupData.joinCode}`}
                      readOnly
                      className="text-sm rounded-xl"
                      data-testid="share-link-display"
                    />
                    <Button
                      onClick={() => copyToClipboard(`app.certichain.com/claim/${groupData.joinCode}`)}
                      className="bg-blue-600 hover:bg-blue-700 text-white rounded-xl px-6"
                    >
                      <ExternalLink className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        )}
        
        {/* Certificate Preview */}
        <div className="grid md:grid-cols-2 gap-6" data-aos="fade-up" data-aos-delay="200">
          <Card>
            <CardHeader className="border-b border-slate-200">
              <CardTitle className="text-xl font-bold text-slate-900">Certificate Preview</CardTitle>
            </CardHeader>
            <CardContent className="p-6">
              <div className="bg-slate-100 rounded-xl p-8 aspect-[4/3] flex items-center justify-center">
                <div className="text-center text-slate-400">
                  <Award className="w-16 h-16 mx-auto mb-4" />
                  <p className="text-sm">Certificate Template</p>
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="border-b border-slate-200">
              <CardTitle className="text-xl font-bold text-slate-900">Claim Form Preview</CardTitle>
            </CardHeader>
            <CardContent className="p-6">
              <div className="bg-slate-50 rounded-xl p-6 space-y-4">
                <div>
                  <label className="text-sm font-medium text-slate-700 mb-2 block">Recipient Name</label>
                  <Input placeholder="Enter name" className="rounded-lg" disabled />
                </div>
                <div>
                  <label className="text-sm font-medium text-slate-700 mb-2 block">Email Address</label>
                  <Input placeholder="Enter email" type="email" className="rounded-lg" disabled />
                </div>
                <Button className="w-full bg-blue-600 text-white py-6 rounded-xl" disabled>
                  Claim Certificate
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
        
        {/* Issued Certificates Table */}
        <Card data-aos="fade-up" data-aos-delay="300">
          <CardHeader className="border-b border-slate-200">
            <div className="flex items-center justify-between">
              <CardTitle className="text-2xl font-bold text-slate-900">Issued Certificates</CardTitle>
              <Badge className="bg-blue-100 text-blue-800">
                {issuedCertificates.length} Issued
              </Badge>
            </div>
          </CardHeader>
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="font-semibold">Recipient</TableHead>
                  <TableHead className="font-semibold">Email</TableHead>
                  <TableHead className="font-semibold">Issue Date</TableHead>
                  <TableHead className="font-semibold">Status</TableHead>
                  <TableHead className="w-12"></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {issuedCertificates.map((cert) => (
                  <TableRow key={cert.id} className="hover:bg-slate-50">
                    <TableCell className="font-medium text-slate-900">{cert.recipientName}</TableCell>
                    <TableCell className="text-slate-600">{cert.recipientEmail}</TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2 text-slate-600">
                        <Calendar className="w-4 h-4" />
                        {new Date(cert.issuedDate).toLocaleDateString()}
                      </div>
                    </TableCell>
                    <TableCell>
                      {cert.status === 'verified' ? (
                        <Badge className="bg-green-100 text-green-800">
                          <CheckCircle2 className="w-3 h-3 mr-1" />
                          Verified
                        </Badge>
                      ) : (
                        <Badge className="bg-yellow-100 text-yellow-800">
                          <Clock className="w-3 h-3 mr-1" />
                          Pending
                        </Badge>
                      )}
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
