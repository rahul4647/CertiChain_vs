import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { ArrowLeft, Users, Award, Calendar, Copy, ExternalLink, CheckCircle2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardHeader, CardContent, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import DashboardLayout from '@/components/DashboardLayout';
import { toast } from 'sonner';
import { supabase } from '@/supabaseClient';


export const GroupDetailsPage = () => {
  const { groupId } = useParams();

  const [group, setGroup] = useState(null);
  const [issuedCertificates, setIssuedCertificates] = useState([]);

  // NEW STATE for template preview + fields
  const [template, setTemplate] = useState(null);
  const [fields, setFields] = useState([]);

  const [loading, setLoading] = useState(true);

  // Load group, template, fields, certificates
  useEffect(() => {
    const loadDetails = async () => {
      try {
        setLoading(true);

        // Load group
        const { data: groupData, error: gErr } = await supabase
          .from("groups")
          .select("*")
          .eq("id", groupId)
          .single();

        if (gErr) throw gErr;
        setGroup(groupData);

        // Load template IF EXISTS
        if (groupData.template_id) {
          const { data: tmpl } = await supabase
            .from("certificate_templates")
            .select("*")
            .eq("id", groupData.template_id)
            .single();

          setTemplate(tmpl);

          const { data: flds } = await supabase
            .from("template_fields")
            .select("*")
            .eq("template_id", groupData.template_id)
            .order("created_at", { ascending: true });

          setFields(flds || []);
        }

        // Load issued certificates
        const { data: certs } = await supabase
          .from("certificates")
          .select("*")
          .eq("group_id", groupId)
          .order("claimed_at", { ascending: false });

        if (certs) {
          setIssuedCertificates(
            certs.map((c) => ({
              id: c.id,
              recipientName: c.field_data?.["Recipient Name"] || "Unknown",
              recipientEmail: c.field_data?.Email || "N/A",
              issuedDate: c.claimed_at,
              status: "verified",
            }))
          );
        }

      } catch (err) {
        console.error(err);
        toast.error("Failed to load group details");
      } finally {
        setLoading(false);
      }
    };

    loadDetails();
  }, [groupId]);


  // Copy Button
  const copyToClipboard = (text) => {
    navigator.clipboard.writeText(text);
    toast.success("Copied!");
  };
  // Open certificate preview in popup (FULL PREVIEW)
  const openCertificatePreview = () => {
    if (!template) return;

    const popup = window.open(
      "",
      "certificatePreview",
      "width=1200,height=850,resizable=yes,scrollbars=yes"
    );

    if (!popup) return;

    popup.document.write(`
      <html>
        <head>
          <title>Certificate Preview</title>
          <style>
            body {
              margin: 0;
              padding: 40px;
              background: #f1f5f9;
              display: flex;
              justify-content: center;
            }
            .canvas {
              position: relative;
              width: 800px;
              height: 560px;
              background: white;
              border-radius: 12px;
              overflow: hidden;
              box-shadow: 0 25px 60px rgba(0,0,0,0.25);
            }
            .field {
              position: absolute;
              background: rgba(219,234,254,0.8);
              border: 2px solid #3b82f6;
              border-radius: 6px;
              font-size: 13px;
              font-family: system-ui, sans-serif;
              color: #1e3a8a;
              display: flex;
              align-items: center;
              justify-content: center;
              box-sizing: border-box;
            }
          </style>
        </head>
        <body>
          <div class="canvas">
            <iframe
              src="${template.pdf_url}#toolbar=0&navpanes=0&scrollbar=0"
              style="position:absolute; inset:0; width:100%; height:100%; border:none; pointer-events:none;"
            ></iframe>

            ${fields.map(f => `
              <div class="field" style="
                left:${f.x}px;
                top:${f.y}px;
                width:${f.width}px;
                height:${f.height}px;
              ">
                ${f.label || ""}
              </div>
            `).join("")}
          </div>
        </body>
      </html>
    `);

    popup.document.close();
    popup.focus();
  };



  if (loading || !group) {
    return (
      <DashboardLayout>
        <div className="text-center py-20 text-slate-500">Loading group details...</div>
      </DashboardLayout>
    );
  }


  return (
    <DashboardLayout>
      <div className="max-w-6xl mx-auto space-y-8">

        {/* HEADER */}
        <div data-aos="fade-down">
          <Link to="/dashboard">
            <Button variant="ghost" className="mb-4 text-slate-600 hover:text-slate-900">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Dashboard
            </Button>
          </Link>

          <div className="flex items-start justify-between">
            <div>
              <h1 className="text-4xl font-bold text-slate-900 mb-2">{group.name}</h1>
              <p className="text-lg text-slate-600">{group.description || "No description provided"}</p>
            </div>

            <Badge className={group.status === 'active'
              ? 'bg-green-100 text-green-800 text-lg px-4 py-2'
              : 'bg-slate-100 text-slate-800 text-lg px-4 py-2'}>
              {group.status}
            </Badge>
          </div>
        </div>


        {/* STATS */}
        <div className="grid md:grid-cols-3 gap-6" data-aos="fade-up">

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-slate-600 mb-1">Learner Capacity</p>
                  <p className="text-3xl font-bold text-slate-900">{group.max_learners}</p>
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
                  <p className="text-3xl font-bold text-slate-900">{issuedCertificates.length}</p>
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
                  <p className="text-3xl font-bold text-slate-900">
                    {new Date(group.created_at).toLocaleDateString('en-US', {
                      month: "short",
                      day: "numeric",
                    })}
                  </p>
                </div>
                <div className="w-14 h-14 bg-purple-100 rounded-xl flex items-center justify-center">
                  <Calendar className="w-7 h-7 text-purple-600" />
                </div>
              </div>
            </CardContent>
          </Card>

        </div>


        {/* JOIN CODE BOX */}
        {group.join_code && (
          <Card data-aos="fade-up" className="bg-gradient-to-br from-blue-50 to-white border-2 border-blue-200">
            <CardContent className="p-8">

              <h2 className="text-2xl font-bold text-slate-900 mb-6">Share with Learners</h2>

              <div className="grid md:grid-cols-2 gap-6">

                {/* Join Code */}
                <div>
                  <label className="text-sm font-medium text-slate-700 mb-2 block">Join Code</label>
                  <div className="flex gap-2">
                    <Input
                      value={group.join_code}
                      readOnly
                      className="font-mono text-lg font-bold rounded-xl"
                    />
                    <Button
                      onClick={() => copyToClipboard(group.join_code)}
                      className="bg-blue-600 hover:bg-blue-700 text-white rounded-xl px-6"
                    >
                      <Copy className="w-4 h-4" />
                    </Button>
                  </div>
                </div>

                {/* Share Link */}
                <div>
                  <label className="text-sm font-medium text-slate-700 mb-2 block">Shareable Link</label>
                  <div className="flex gap-2">
                    <Input
                      value={`${window.location.origin}/join/${group.join_code}`}
                      readOnly
                      className="text-sm rounded-xl"
                    />
                    <Button
                      onClick={() => copyToClipboard(`${window.location.origin}/join/${group.join_code}`)}
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


        {/* ------------------------- */}
        {/* CERTIFICATE PREVIEW + FORM */}
        {/* ------------------------- */}
        <div className="grid md:grid-cols-2 gap-6" data-aos="fade-up">

          {/* CERTIFICATE PREVIEW */}
          {/* CERTIFICATE PREVIEW */}
            <Card>
              <CardHeader className="border-b border-slate-200">
                <CardTitle className="text-xl font-bold text-slate-900">
                  Certificate Preview
                </CardTitle>
              </CardHeader>

              <CardContent className="p-6">
                {!template ? (
                  <div className="bg-slate-100 rounded-xl p-8 aspect-[4/3] flex items-center justify-center">
                    <div className="text-center text-slate-400">
                      <Award className="w-16 h-16 mx-auto mb-4" />
                      <p className="text-sm">Certificate Template</p>
                    </div>
                  </div>
                ) : (
                  <div className="bg-slate-100 rounded-xl p-8 flex items-center justify-center">
                    <Button
                      className="bg-blue-600 hover:bg-blue-700 text-white px-8 py-6 rounded-xl text-lg"
                      onClick={() => openCertificatePreview()}
                    >
                      Preview Certificate
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>


          {/* CLAIM FORM PREVIEW */}
          <Card>
            <CardHeader className="border-b border-slate-200">
              <CardTitle className="text-xl font-bold text-slate-900">Claim Form Preview</CardTitle>
            </CardHeader>

            <CardContent className="p-6">
              <div className="bg-slate-50 rounded-xl p-6 space-y-4">

                {fields.length === 0 ? (
                  <p className="text-center text-slate-400 py-10">No form fields configured</p>
                ) : (
                  <>
                    {fields.map((field) => (
                      <div key={field.id}>
                        <label className="text-sm font-medium text-slate-700 mb-2 block">{field.label}</label>
                        <Input placeholder={`Enter ${field.label}`} className="rounded-lg" disabled />
                      </div>
                    ))}

                    <Button className="w-full bg-blue-600 text-white py-6 rounded-xl" disabled>
                      Claim Certificate
                    </Button>
                  </>
                )}

              </div>
            </CardContent>
          </Card>

        </div>


        {/* ------------------------- */}
        {/*     ISSUED CERTIFICATES   */}
        {/* ------------------------- */}
        <Card data-aos="fade-up">
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
                      <Badge className="bg-green-100 text-green-800">
                        <CheckCircle2 className="w-3 h-3 mr-1" />
                        Verified
                      </Badge>
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

export default GroupDetailsPage;
