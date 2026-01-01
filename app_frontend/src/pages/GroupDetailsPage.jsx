import React, { useEffect, useState,useRef } from 'react';
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
  const [pdfPage, setPdfPage] = useState(null);
  const canvasRef = useRef(null);

  // NEW STATE for template preview + fields
  const [template, setTemplate] = useState(null);
  const [fields, setFields] = useState([]);

  const [loading, setLoading] = useState(true);
  const [pdfDimensions, setPdfDimensions] = useState({ width: 800, height: 560 });

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
        // Load template IF EXISTS
        if (groupData.template_id) {
          const { data: tmpl } = await supabase
            .from("certificate_templates")
            .select("*")
            .eq("id", groupData.template_id)
            .single();
          setTemplate(tmpl);

          // NEW: Load PDF dimensions
          // Replace the existing PDF dimensions loading code with:
          if (tmpl?.pdf_url) {
            try {
              const loadingTask = window.pdfjsLib.getDocument(tmpl.pdf_url);
              const pdf = await loadingTask.promise;
              const page = await pdf.getPage(1);
              setPdfPage(page);
              const viewport = page.getViewport({ scale: 1 });
              setPdfDimensions({ width: viewport.width, height: viewport.height });
            } catch (err) {
              console.error("Failed to load PDF:", err);
              setPdfDimensions({ width: 800, height: 560 });
            }
          }

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

  useEffect(() => {
  if (!pdfPage || !canvasRef.current) return;

  const renderCanvas = async () => {
    const canvas = canvasRef.current;
    const container = canvas.parentElement;
    
    if (!container) return;

    const containerWidth = container.offsetWidth;
    const scale = containerWidth / pdfDimensions.width;
    
    const viewport = pdfPage.getViewport({ scale });
    canvas.width = viewport.width;
    canvas.height = viewport.height;

    const context = canvas.getContext('2d');
    
    try {
      await pdfPage.render({
        canvasContext: context,
        viewport: viewport
      }).promise;
    } catch (err) {
      console.error("Canvas render error:", err);
    }
  };

  renderCanvas();
}, [pdfPage, pdfDimensions]);


  // Copy Button
  const copyToClipboard = (text) => {
    navigator.clipboard.writeText(text);
    toast.success("Copied!");
  };
  // Open certificate preview in popup (FULL PREVIEW)
  const openCertificatePreview = async () => {
  if (!template || !pdfPage) return;
  
  const popup = window.open(
    "",
    "certificatePreview",
    "width=1400,height=900,resizable=yes,scrollbars=yes"
  );
  
  if (!popup) {
    toast.error("Please allow popups to view full preview");
    return;
  }

  const displayWidth = 1200;
  const scale = displayWidth / pdfDimensions.width;
  const displayHeight = pdfDimensions.height * scale;

  // Render PDF to canvas
  const tempCanvas = document.createElement('canvas');
  const viewport = pdfPage.getViewport({ scale });
  tempCanvas.width = viewport.width;
  tempCanvas.height = viewport.height;
  const context = tempCanvas.getContext('2d');
  
  await pdfPage.render({
    canvasContext: context,
    viewport: viewport
  }).promise;

  const pdfDataUrl = tempCanvas.toDataURL('image/png');
  
  popup.document.write(`
    <!DOCTYPE html>
    <html>
      <head>
        <title>Certificate Preview - ${group.name}</title>
        <meta charset="UTF-8">
        <style>
          * { margin: 0; padding: 0; box-sizing: border-box; }
          body {
            margin: 0;
            padding: 40px;
            background: #f1f5f9;
            display: flex;
            justify-content: center;
            align-items: flex-start;
            min-height: 100vh;
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
          }
          .canvas {
            position: relative;
            width: ${displayWidth}px;
            height: ${displayHeight}px;
            background: white;
            border-radius: 12px;
            overflow: hidden;
            box-shadow: 0 25px 60px rgba(0,0,0,0.25);
          }
          .pdf-image {
            position: absolute;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            object-fit: contain;
          }
          .field {
            position: absolute;
            background: rgba(219,234,254,0.85);
            border: 2px solid #3b82f6;
            border-radius: 6px;
            display: flex;
            align-items: center;
            justify-content: center;
            font-family: inherit;
            color: #1e3a8a;
            font-weight: 600;
            padding: 8px 12px;
            box-sizing: border-box;
          }
          .qr-container {
            position: absolute;
            display: flex;
            align-items: center;
            justify-content: center;
          }
          .qr-img {
            max-width: 100%;
            max-height: 100%;
            object-fit: contain;
          }
        </style>
      </head>
      <body>
        <div class="canvas">
          <img src="${pdfDataUrl}" class="pdf-image" alt="Certificate" />
          ${fields.map(f => {
            const leftPx = f.x * scale;
            const topPx = f.y * scale;
            const widthPx = f.width * scale;
            const heightPx = f.height * scale;
            
            if (f.type === "qr") {
              return `
                <div class="qr-container" style="
                  left: ${leftPx}px;
                  top: ${topPx}px;
                  width: ${widthPx}px;
                  height: ${heightPx}px;
                ">
                  <img src="${f.qr_image}" class="qr-img" alt="QR Code" />
                </div>
              `;
            } else {
              const fontSize = Math.max(12, heightPx * 0.4);
              return `
                <div class="field" style="
                  left: ${leftPx}px;
                  top: ${topPx}px;
                  width: ${widthPx}px;
                  height: ${heightPx}px;
                  font-size: ${fontSize}px;
                ">
                  ${f.label || ""}
                </div>
              `;
            }
          }).join("")}
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
                <div className="space-y-4">
                  {/* Inline preview thumbnail */}
                  {/* Inline preview thumbnail */}
                    <div 
                      className="bg-slate-100 rounded-xl p-4 border-2 border-slate-300"
                      style={{
                        aspectRatio: `${pdfDimensions.width} / ${pdfDimensions.height}`
                      }}
                    >
                      <div 
                        className="relative mx-auto bg-white shadow-md rounded-md overflow-hidden"
                        style={{
                          width: '100%',
                          height: '100%'
                        }}
                      >
                        <canvas 
                          ref={canvasRef}
                          style={{
                            position: 'absolute',
                            top: 0,
                            left: 0,
                            width: '100%',
                            height: '100%',
                            objectFit: 'contain'
                          }}
                        />
                        {fields.map((f) => {
                          const leftPct = (f.x / pdfDimensions.width) * 100;
                          const topPct = (f.y / pdfDimensions.height) * 100;
                          const widthPct = (f.width / pdfDimensions.width) * 100;
                          const heightPct = (f.height / pdfDimensions.height) * 100;

                          return (
                            <div 
                              key={f.id}
                              style={{
                                position: "absolute",
                                left: `${leftPct}%`,
                                top: `${topPct}%`,
                                width: `${widthPct}%`,
                                height: `${heightPct}%`,
                                background: f.type === "qr" ? "transparent" : "rgba(219, 234, 254, 0.7)",
                                border: "2px solid #3b82f6",
                                borderRadius: 4,
                                boxSizing: "border-box",
                                display: "flex",
                                alignItems: "center",
                                justifyContent: "center",
                                zIndex: 10,
                              }}
                            >
                              {f.type === "text" ? (
                                <span 
                                  style={{ 
                                    padding: "2px 6px",
                                    fontSize: "10px",
                                    fontWeight: 600,
                                    color: "#1e3a8a",
                                    whiteSpace: 'nowrap',
                                    overflow: 'hidden',
                                    textOverflow: 'ellipsis',
                                    maxWidth: '100%'
                                  }}
                                >
                                  {f.label}
                                </span>
                              ) : (
                                <img 
                                  src={f.qr_image} 
                                  alt="qr" 
                                  style={{ 
                                    width: '90%', 
                                    height: '90%', 
                                    objectFit: 'contain' 
                                  }} 
                                />
                              )}
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  
                  {/* Full preview button */}
                  <Button
                    className="w-full bg-blue-600 hover:bg-blue-700 text-white py-6 rounded-xl text-lg"
                    onClick={openCertificatePreview}
                  >
                    <ExternalLink className="w-5 h-5 mr-2" />
                    Open Full Preview
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
