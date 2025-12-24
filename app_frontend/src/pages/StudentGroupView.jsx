import React, { useState, useEffect } from 'react';
import { Award, Calendar, Users, CheckCircle2, Download, Share2, ExternalLink, FileText, ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardHeader, CardContent, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { supabase } from '@/supabaseClient';
import { toast } from 'sonner';

export const StudentGroupView = () => {
  // Get groupId from URL path
  const groupId = window.location.pathname.split('/').pop();

  const [group, setGroup] = useState(null);
  const [template, setTemplate] = useState(null);
  const [fields, setFields] = useState([]);
  const [formData, setFormData] = useState({});
  const [totalParticipants, setTotalParticipants] = useState(0);
  const [pdfDimensions, setPdfDimensions] = useState({ width: 800, height: 560 });
  const [pdfPage, setPdfPage] = useState(null);
  const canvasRef = useRef(null);
  const [loading, setLoading] = useState(true);
  const [claiming, setClaiming] = useState(false);
  const [claimed, setClaimed] = useState(false);
  const [certificateId, setCertificateId] = useState(null);

  useEffect(() => {
    loadGroupDetails();
  }, [groupId]);

  const loadGroupDetails = async () => {
    try {
      setLoading(true);

      // Load group
      const { data: groupData, error: groupError } = await supabase
        .from('groups')
        .select('*')
        .eq('id', groupId)
        .single();

      if (groupError) throw groupError;
      setGroup(groupData);

      // Load template and fields
      if (groupData.template_id) {
        const { data: tmpl } = await supabase
          .from('certificate_templates')
          .select('*')
          .eq('id', groupData.template_id)
          .single();
        setTemplate(tmpl);

        // Load PDF dimensions
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
          .from('template_fields')
          .select('*')
          .eq('template_id', groupData.template_id)
          .order('created_at', { ascending: true });
        setFields(flds || []);
      }

      // Get total participants count
      const { count } = await supabase
        .from('certificates')
        .select('*', { count: 'exact', head: true })
        .eq('group_id', groupId);
      setTotalParticipants(count || 0);

    } catch (err) {
      console.error(err);
      toast.error('Failed to load group details');
    } finally {
      setLoading(false);
    }
  };
  // Add this new useEffect after the loadDetails useEffect
useEffect(() => {
  if (!pdfPage || !canvasRef.current) return;

  const canvas = canvasRef.current;
  const container = canvas.parentElement;
  const containerWidth = container.offsetWidth;
  const scale = containerWidth / pdfDimensions.width;
  
  const viewport = pdfPage.getViewport({ scale });
  canvas.width = viewport.width;
  canvas.height = viewport.height;
  canvas.style.width = '100%';
  canvas.style.height = '100%';

  const context = canvas.getContext('2d');
  const renderContext = {
    canvasContext: context,
    viewport: viewport
  };
  
  pdfPage.render(renderContext);
}, [pdfPage, pdfDimensions]);

  const handleInputChange = (fieldId, value) => {
    setFormData(prev => ({ ...prev, [fieldId]: value }));
  };

  const handleClaimCertificate = async () => {
    // Validate required fields
    const requiredFields = fields.filter(f => f.type === 'text');
    const missingFields = requiredFields.filter(f => !formData[f.id]?.trim());
    
    if (missingFields.length > 0) {
      toast.error('Please fill in all required fields');
      return;
    }

    setClaiming(true);

    try {
      const { data: sessionData } = await supabase.auth.getSession();
      const user = sessionData?.session?.user;

      // Build field_data object
      const fieldDataObj = {};
      fields.forEach(field => {
        if (field.type === 'text') {
          fieldDataObj[field.label] = formData[field.id] || '';
        }
      });

      // Insert certificate
      const { data: cert, error: certError } = await supabase
        .from('certificates')
        .insert([
          {
            group_id: groupId,
            template_id: template.id,
            claimed_by: user?.id || null,
            field_data: fieldDataObj,
            claimed_at: new Date().toISOString(),
          },
        ])
        .select()
        .single();

      if (certError) throw certError;

      setCertificateId(cert.id);
      setClaimed(true);
      toast.success('Certificate claimed successfully! 🎉');

    } catch (err) {
      console.error('Claim error:', err);
      toast.error('Failed to claim certificate');
    } finally {
      setClaiming(false);
    }
  };
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

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-slate-600">Loading group details...</p>
        </div>
      </div>
    );
  }

  if (!group) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 flex items-center justify-center">
        <div className="text-center">
          <p className="text-slate-600">Group not found</p>
        </div>
      </div>
    );
  }

  if (claimed) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-green-50 via-white to-blue-50">
        <header className="bg-white border-b border-slate-200 shadow-sm">
          <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-blue-600 rounded-xl flex items-center justify-center">
                <Award className="w-6 h-6 text-white" />
              </div>
              <h1 className="text-2xl font-bold text-slate-900">CertiChain</h1>
            </div>
          </div>
        </header>

        <div className="max-w-4xl mx-auto px-6 py-20">
          <Card className="bg-gradient-to-br from-green-50 to-white border-2 border-green-200 shadow-xl">
            <CardContent className="p-12 text-center">
              <div className="w-24 h-24 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
                <CheckCircle2 className="w-14 h-14 text-green-600" />
              </div>
              <h2 className="text-4xl font-bold text-slate-900 mb-4">
                Certificate Claimed Successfully! 🎉
              </h2>
              <p className="text-lg text-slate-600 mb-8">
                Your certificate has been generated and is ready to download
              </p>

              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <Button className="bg-blue-600 hover:bg-blue-700 text-white px-8 py-6 rounded-xl text-lg shadow-lg">
                  <Download className="w-5 h-5 mr-2" />
                  Download Certificate
                </Button>
                <Button variant="outline" className="px-8 py-6 rounded-xl text-lg border-2">
                  <Share2 className="w-5 h-5 mr-2" />
                  Share on LinkedIn
                </Button>
              </div>

              <div className="mt-8 pt-8 border-t border-slate-200">
                <p className="text-sm text-slate-600 mb-4">Certificate ID: #{certificateId}</p>
                <Button variant="ghost" className="text-blue-600 hover:text-blue-700">
                  <ExternalLink className="w-4 h-4 mr-2" />
                  View Verification Page
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

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
          <Badge className={group.status === 'active' 
            ? 'bg-green-100 text-green-800 text-sm px-4 py-2'
            : 'bg-slate-100 text-slate-800 text-sm px-4 py-2'
          }>
            {group.status}
          </Badge>
        </div>
      </header>

      {/* Main Content */}
      <div className="max-w-6xl mx-auto px-6 py-12">
        
        {/* Back Button */}
        <Button
          variant="ghost"
          className="mb-6 text-slate-600 hover:text-slate-900"
          onClick={() => window.history.back()}
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back
        </Button>

        {/* Group Header */}
        <div className="mb-8">
          <h2 className="text-4xl font-bold text-slate-900 mb-3">{group.name}</h2>
          <p className="text-lg text-slate-600">{group.description || 'No description provided'}</p>
        </div>

        {/* Stats Cards */}
        <div className="grid md:grid-cols-3 gap-6 mb-8">
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-slate-600 mb-1">Organization</p>
                  <p className="text-xl font-bold text-slate-900">Tech Academy</p>
                </div>
                <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center">
                  <FileText className="w-6 h-6 text-blue-600" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-slate-600 mb-1">Participants</p>
                  <p className="text-xl font-bold text-slate-900">{totalParticipants}</p>
                </div>
                <div className="w-12 h-12 bg-purple-100 rounded-xl flex items-center justify-center">
                  <Users className="w-6 h-6 text-purple-600" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-slate-600 mb-1">Created</p>
                  <p className="text-xl font-bold text-slate-900">
                    {new Date(group.created_at).toLocaleDateString('en-US', {
                      month: 'short',
                      day: 'numeric',
                      year: 'numeric'
                    })}
                  </p>
                </div>
                <div className="w-12 h-12 bg-green-100 rounded-xl flex items-center justify-center">
                  <Calendar className="w-6 h-6 text-green-600" />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Main Content Grid */}
        <div className="grid lg:grid-cols-2 gap-8">
          
          {/* Certificate Preview */}
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
                    <p className="text-sm">No template available</p>
                  </div>
                </div>
              ) : (
                <div className="space-y-4">
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
                  
                  <Button
                    onClick={openCertificatePreview}
                    variant="outline"
                    className="w-full py-3 rounded-xl"
                  >
                    <ExternalLink className="w-4 h-4 mr-2" />
                    View Full Preview
                  </Button>
                </div>
              )}

              <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 mt-4">
                <p className="text-sm text-blue-800">
                  <CheckCircle2 className="w-4 h-4 inline mr-2" />
                  Your certificate will be generated with your information after claiming
                </p>
              </div>
            </CardContent>
          </Card>

          {/* Claim Form */}
          <Card>
            <CardHeader className="border-b border-slate-200">
              <CardTitle className="text-xl font-bold text-slate-900">
                Claim Your Certificate
              </CardTitle>
            </CardHeader>
            <CardContent className="p-6">
              <div className="space-y-4 mb-6">
                {fields.filter(f => f.type === 'text').map((field) => (
                  <div key={field.id}>
                    <label className="text-sm font-semibold text-slate-700 mb-2 block">
                      {field.label}
                      <span className="text-red-500 ml-1">*</span>
                    </label>
                    <Input
                      type="text"
                      placeholder={`Enter ${field.label.toLowerCase()}`}
                      value={formData[field.id] || ''}
                      onChange={(e) => handleInputChange(field.id, e.target.value)}
                      className="rounded-xl py-6 text-lg"
                    />
                  </div>
                ))}
              </div>

              <Button
                onClick={handleClaimCertificate}
                disabled={claiming}
                className="w-full bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white py-7 rounded-xl text-lg font-semibold shadow-lg disabled:opacity-50"
              >
                {claiming ? (
                  <>
                    <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></div>
                    Processing...
                  </>
                ) : (
                  <>
                    <Award className="w-5 h-5 mr-2" />
                    Claim Certificate
                  </>
                )}
              </Button>

              <div className="mt-6 pt-6 border-t border-slate-200">
                <div className="flex items-start gap-3 text-sm text-slate-600">
                  <CheckCircle2 className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
                  <div>
                    <p className="font-medium text-slate-900 mb-1">Blockchain Verified</p>
                    <p>Your certificate will be securely stored and can be verified anytime.</p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

        </div>

      </div>
    </div>
  );
};

export default StudentGroupView;