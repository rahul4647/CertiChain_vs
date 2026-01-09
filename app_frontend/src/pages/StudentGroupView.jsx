import React, { useState, useEffect, useRef } from 'react';
import { Award, Calendar, Users, CheckCircle2, Download, Share2, ExternalLink, FileText, ArrowLeft, Loader2, Mail, QrCode } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardHeader, CardContent, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { supabase } from '@/supabaseClient';
import { toast } from 'sonner';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL || 'http://localhost:8001';

export const StudentGroupView = () => {
  // Get groupId from URL path
  const groupId = window.location.pathname.split('/').pop();

  const [group, setGroup] = useState(null);
  const [template, setTemplate] = useState(null);
  const [fields, setFields] = useState([]);
  const [formData, setFormData] = useState({});
  const [totalParticipants, setTotalParticipants] = useState(0);
  const [pdfDimensions, setPdfDimensions] = useState({ width: 800, height: 560 });
  const canvasRef = useRef(null);
  const [loading, setLoading] = useState(true);
  const [claiming, setClaiming] = useState(false);
  const [minting, setMinting] = useState(false);
  const [claimed, setClaimed] = useState(false);
  const [certificateId, setCertificateId] = useState(null);
  const [mintingResult, setMintingResult] = useState(null);
  
  // Additional form fields for minting
  const [recipientEmail, setRecipientEmail] = useState('');
  const [studentId, setStudentId] = useState('');

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

        // Load image dimensions for JPG template
        if (tmpl?.pdf_url) {
          const img = new Image();
          img.onload = () => {
            setPdfDimensions({ width: img.naturalWidth, height: img.naturalHeight });
          };
          img.onerror = () => {
            console.error("Failed to load template image");
            setPdfDimensions({ width: 800, height: 560 });
          };
          img.src = tmpl.pdf_url;
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

    if (!recipientEmail || !recipientEmail.includes('@')) {
      toast.error('Please enter a valid email address');
      return;
    }

    setClaiming(true);

    try {
      const { data: sessionData } = await supabase.auth.getSession();
      const user = sessionData?.session?.user;

      // Build field_data object with labels as keys
      const fieldDataObj = {};
      fields.forEach(field => {
        if (field.type === 'text') {
          fieldDataObj[field.label] = formData[field.id] || '';
        }
      });

      // Get recipient name from fields (usually the first text field)
      const recipientNameField = fields.find(f => f.label?.toLowerCase().includes('name') || f.label?.toLowerCase().includes('recipient'));
      const recipientName = recipientNameField ? (formData[recipientNameField.id] || '') : (fieldDataObj['Recipient Name'] || 'Student');

      // Insert certificate record
      const { data: cert, error: certError } = await supabase
        .from('certificates')
        .insert([
          {
            group_id: groupId,
            template_id: template.id,
            claimed_by: user?.id || null,
            field_data: fieldDataObj,
            claimed_at: new Date().toISOString(),
            status: 'pending'
          },
        ])
        .select()
        .single();

      if (certError) throw certError;

      setCertificateId(cert.id);
      toast.success('Certificate record created! Starting minting process...');
      
      // Now trigger minting
      setMinting(true);
      setClaiming(false);

      const mintResponse = await fetch(`${BACKEND_URL}/api/certificates/mint`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          certificate_db_id: cert.id,
          group_id: groupId,
          template_id: template.id,
          field_data: fieldDataObj,
          recipient_email: recipientEmail,
          recipient_name: recipientName,
          student_id: studentId || null
        })
      });

      if (!mintResponse.ok) {
        const errorData = await mintResponse.json();
        throw new Error(errorData.detail || 'Minting failed');
      }

      const mintData = await mintResponse.json();
      setMintingResult(mintData);
      setClaimed(true);
      toast.success('Certificate minted successfully! 🎉');

    } catch (err) {
      console.error('Claim/Mint error:', err);
      toast.error(err.message || 'Failed to claim certificate');
      setMinting(false);
    } finally {
      setClaiming(false);
      setMinting(false);
    }
  };

  const openCertificatePreview = () => {
    if (!template) return;
    
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
            .template-image {
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
            <img src="${template.pdf_url}" class="template-image" alt="Certificate Template" />
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
                const displayValue = formData[f.id] || f.label;
                return `
                  <div class="field" style="
                    left: ${leftPx}px;
                    top: ${topPx}px;
                    width: ${widthPx}px;
                    height: ${heightPx}px;
                    font-size: ${fontSize}px;
                  ">
                    ${displayValue}
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

  // SUCCESS STATE - Certificate Minted
  if (claimed && mintingResult) {
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

        <div className="max-w-4xl mx-auto px-6 py-12">
          <Card className="bg-gradient-to-br from-green-50 to-white border-2 border-green-200 shadow-xl">
            <CardContent className="p-12 text-center">
              <div className="w-24 h-24 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
                <CheckCircle2 className="w-14 h-14 text-green-600" />
              </div>
              <h2 className="text-4xl font-bold text-slate-900 mb-4">
                Certificate Minted Successfully! 🎉
              </h2>
              <p className="text-lg text-slate-600 mb-8">
                Your certificate has been generated with a unique QR code and minted on the blockchain.
              </p>

              {/* Certificate Preview */}
              {mintingResult.certificate_image_url && (
                <div className="bg-slate-100 rounded-xl p-4 mb-8">
                  <img 
                    src={mintingResult.certificate_image_url} 
                    alt="Your Certificate" 
                    className="w-full max-w-2xl mx-auto rounded-lg shadow-lg"
                  />
                </div>
              )}

              {/* QR Code */}
              {mintingResult.qr_code && (
                <div className="mb-8">
                  <p className="text-sm text-slate-600 mb-2">Scan to verify:</p>
                  <img 
                    src={`data:image/png;base64,${mintingResult.qr_code}`} 
                    alt="Verification QR Code" 
                    className="w-32 h-32 mx-auto rounded-lg shadow-md"
                  />
                </div>
              )}

              {/* Details */}
              <div className="bg-white rounded-xl p-6 border border-slate-200 mb-8 text-left max-w-md mx-auto">
                <h3 className="font-semibold text-slate-900 mb-4">Certificate Details</h3>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-slate-500">Certificate ID:</span>
                    <code className="bg-slate-100 px-2 py-0.5 rounded text-xs">{mintingResult.certificate_id}</code>
                  </div>
                  {mintingResult.nft_id && (
                    <div className="flex justify-between">
                      <span className="text-slate-500">NFT ID:</span>
                      <code className="bg-slate-100 px-2 py-0.5 rounded text-xs">{mintingResult.nft_id}</code>
                    </div>
                  )}
                  {mintingResult.token_id && mintingResult.token_id !== 'pending' && (
                    <div className="flex justify-between">
                      <span className="text-slate-500">Token ID:</span>
                      <span>{mintingResult.token_id}</span>
                    </div>
                  )}
                </div>
              </div>

              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                {mintingResult.certificate_image_url && (
                  <a href={mintingResult.certificate_image_url} target="_blank" rel="noopener noreferrer">
                    <Button className="bg-blue-600 hover:bg-blue-700 text-white px-8 py-6 rounded-xl text-lg shadow-lg w-full sm:w-auto">
                      <Download className="w-5 h-5 mr-2" />
                      Download Certificate
                    </Button>
                  </a>
                )}
                <a 
                  href={`https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(mintingResult.verification_url)}`}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  <Button variant="outline" className="px-8 py-6 rounded-xl text-lg border-2 w-full sm:w-auto">
                    <Share2 className="w-5 h-5 mr-2" />
                    Share on LinkedIn
                  </Button>
                </a>
              </div>

              <div className="mt-8 pt-8 border-t border-slate-200">
                <a href={mintingResult.verification_url} target="_blank" rel="noopener noreferrer">
                  <Button variant="ghost" className="text-blue-600 hover:text-blue-700">
                    <ExternalLink className="w-4 h-4 mr-2" />
                    View Verification Page
                  </Button>
                </a>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  // MINTING STATE
  if (minting) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 flex items-center justify-center">
        <Card className="max-w-md w-full shadow-xl">
          <CardContent className="p-12 text-center">
            <Loader2 className="w-16 h-16 text-blue-600 animate-spin mx-auto mb-6" />
            <h2 className="text-2xl font-bold text-slate-900 mb-4">Minting Your Certificate</h2>
            <p className="text-slate-600 mb-4">
              Please wait while we generate your certificate image, create the QR code, and mint it on the blockchain...
            </p>
            <div className="space-y-2 text-sm text-slate-500">
              <p>✓ Creating certificate record</p>
              <p>✓ Generating certificate image</p>
              <p className="text-blue-600 font-medium">⏳ Minting NFT on Polygon...</p>
              <p className="opacity-50">Updating database</p>
            </div>
          </CardContent>
        </Card>
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
                  <p className="text-xl font-bold text-slate-900">CertiChain</p>
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
                      {/* Template Image */}
                      <img 
                        src={template.pdf_url}
                        alt="Certificate Template"
                        style={{
                          position: 'absolute',
                          top: 0,
                          left: 0,
                          width: '100%',
                          height: '100%',
                          objectFit: 'contain'
                        }}
                      />
                      {/* Field overlays */}
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
                                {formData[f.id] || f.label}
                              </span>
                            ) : (
                              <div className="flex items-center justify-center w-full h-full">
                                <QrCode className="w-1/2 h-1/2 text-slate-400" />
                              </div>
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
                  Your certificate will be generated with your information and a unique QR code after claiming
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
                {/* Dynamic template fields */}
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

                {/* Email field for NFT delivery */}
                <div>
                  <label className="text-sm font-semibold text-slate-700 mb-2 block">
                    <Mail className="w-4 h-4 inline mr-1" />
                    Email Address
                    <span className="text-red-500 ml-1">*</span>
                  </label>
                  <Input
                    type="email"
                    placeholder="your@email.com"
                    value={recipientEmail}
                    onChange={(e) => setRecipientEmail(e.target.value)}
                    className="rounded-xl py-6 text-lg"
                  />
                  <p className="text-xs text-slate-500 mt-1">NFT certificate will be delivered to this email</p>
                </div>

                {/* Optional Student ID */}
                <div>
                  <label className="text-sm font-semibold text-slate-700 mb-2 block">
                    Student ID (Optional)
                  </label>
                  <Input
                    type="text"
                    placeholder="Enter student ID if applicable"
                    value={studentId}
                    onChange={(e) => setStudentId(e.target.value)}
                    className="rounded-xl py-6 text-lg"
                  />
                </div>
              </div>

              <Button
                onClick={handleClaimCertificate}
                disabled={claiming || minting}
                className="w-full bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white py-7 rounded-xl text-lg font-semibold shadow-lg disabled:opacity-50"
              >
                {claiming ? (
                  <>
                    <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                    Creating Certificate...
                  </>
                ) : minting ? (
                  <>
                    <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                    Minting NFT...
                  </>
                ) : (
                  <>
                    <Award className="w-5 h-5 mr-2" />
                    Claim & Mint Certificate
                  </>
                )}
              </Button>

              <div className="mt-6 pt-6 border-t border-slate-200">
                <div className="flex items-start gap-3 text-sm text-slate-600">
                  <CheckCircle2 className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
                  <div>
                    <p className="font-medium text-slate-900 mb-1">Blockchain Verified</p>
                    <p>Your certificate will be minted as an NFT on Polygon and can be verified anytime via QR code.</p>
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
