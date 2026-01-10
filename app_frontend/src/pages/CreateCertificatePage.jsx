import { walletService } from "@/services/walletService";

import React, { useState, useRef, useEffect } from "react";
import {
  ArrowLeft,
  ArrowRight,
  Check,
  Upload,
  Plus,
  Trash2,
  GripVertical,
  Copy,
  Share2,
  CheckCircle,
  ExternalLink,
  Crown,
  AlertTriangle
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import DashboardLayout from "@/components/DashboardLayout";
import { supabase } from "@/supabaseClient";
import { useNavigate, Link } from "react-router-dom";
import QRCode from "qrcode";

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;

export const CreateCertificatePage = () => {
  const navigate = useNavigate();

  const [currentStep, setCurrentStep] = useState(1);
  const [courseTitle, setCourseTitle] = useState("");
  const [description, setDescription] = useState("");
  const [learners, setLearners] = useState(50);
  const [pdfDimensions, setPdfDimensions] = useState({ width: 800, height: 560 });

  const [pdfFile, setPdfFile] = useState(null);
  const [pdfUrl, setPdfUrl] = useState(null);
  const fileInputRef = useRef(null);
  const previewRef = useRef(null);

  // Subscription status
  const [subscriptionStatus, setSubscriptionStatus] = useState(null);
  const [canCreateGroup, setCanCreateGroup] = useState(true);

  // fields now support type: "text" | "qr" and qrImage for qr type
  const [fields, setFields] = useState([
    { id: Date.now().toString(), type: "text", label: "Recipient Name", x: 50, y: 80, width: 250, height: 36 },
  ]);

  const draggingRef = useRef({ id: null, offsetX: 0, offsetY: 0 });
  const resizingRef = useRef({ id: null });

  const [loading, setLoading] = useState(false);

  // Check subscription limits on load
  useEffect(() => {
    const checkLimits = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      const user = session?.user;
      if (!user) {
        navigate('/login');
        return;
      }

      try {
        const res = await fetch(`${BACKEND_URL}/api/subscription/status/${user.id}`);
        if (res.ok) {
          const data = await res.json();
          setSubscriptionStatus(data);
          setCanCreateGroup(data.can_create_group);
        }
      } catch (err) {
        console.error('Failed to check subscription status:', err);
      }
    };

    checkLimits();
  }, [navigate]);

  // NEW — store deployed group info
  const [deployedGroup, setDeployedGroup] = useState(null);
  const [copied, setCopied] = useState(false);

  // NEW — expand state
  const [expanded, setExpanded] = useState(false);

  // ============================
  // OPEN FULL POPUP PREVIEW
  // ============================
  const openFullPreview = () => {
    if (!pdfUrl) return alert("Upload an image first");

    const popup = window.open(
      "",
      "certificatePreview",
      "popup=yes,width=1400,height=900,left=200,top=100,resizable=yes,scrollbars=yes"
    );

    if (!popup) {
      return alert("Popup blocked! Please enable popups for this site.");
    }

    popup.document.write(`
      <html>
        <head>
          <title>Certificate Full Preview</title>
          <style>
            body {
              margin: 0;
              padding: 40px;
              background: #f1f5f9;
              display: flex;
              justify-content: center;
              align-items: flex-start;
              min-height: 100vh;
            }
            .canvas {
              position: relative;
              width: 800px;
              height: 560px;
              background: white;
              border-radius: 10px;
              overflow: hidden;
              box-shadow: 0 0 25px rgba(0,0,0,0.18);
            }
            .canvas img.bg {
              position: absolute;
              top: 0;
              left: 0;
              width: 100%;
              height: 100%;
              object-fit: contain;
            }
            .field-box {
              position: absolute;
              background: rgba(219,234,254,0.8);
              border: 2px solid #3b82f6;
              border-radius: 6px;
              display: flex;
              justify-content: center;
              align-items: center;
              font-family: sans-serif;
              font-size: 13px;
              color: #1e3a8a;
              pointer-events: none;
            }
            .qr-img {
              width: 100%;
              height: 100%;
              object-fit: contain;
            }
          </style>
        </head>

        <body>
          <div class="canvas">
            <img class="bg" src="${pdfUrl}" alt="Certificate Template" />

            ${fields
              .map(
                (f) => {
                  if (f.type === "qr") {
                    return `<div style="position:absolute; left:${f.x}px; top:${f.y}px; width:${f.width}px; height:${f.height}px;">
                              <img src="${f.qrImage}" class="qr-img" />
                            </div>`;
                  } else {
                    return `<div class="field-box" style="left:${f.x}px; top:${f.y}px; width:${f.width}px; height:${f.height}px;">
                              ${f.label}
                            </div>`;
                  }
                }
              )
              .join("")}
          </div>
        </body>
      </html>
    `);

    popup.document.close();
    popup.focus();
  };

  // ============================
  // JOIN CODE GENERATOR
  // ============================
  const generateJoinCode = () => {
    const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
    let code = "";
    for (let i = 0; i < 8; i++) {
      code += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return code;
  };

  // ============================
  // IMAGE UPLOAD (JPG only)
  // ============================
  const uploadImageToStorage = async (file) => {
    if (!file) return null;
    const fileExt = file.name.split(".").pop();
    const fileName = `template-${Date.now()}.${fileExt}`;
    const bucket = "certificate-templates";

    try {
      const { data, error } = await supabase.storage
        .from(bucket)
        .upload(fileName, file, { upsert: false });

      if (error) throw error;

      const { data: urlData } = supabase.storage
        .from(bucket)
        .getPublicUrl(data.path);

      return urlData.publicUrl;
    } catch (err) {
      alert("Image upload failed: " + err.message);
      return null;
    }
  };

    const onSelectFile = async (e) => {
      const file = e.target.files?.[0];
      if (!file) return;

      // Validate JPG/JPEG only
      const validTypes = ['image/jpeg', 'image/jpg'];
      if (!validTypes.includes(file.type)) {
        alert("Please upload a JPG/JPEG image only");
        return;
      }

      if (file.size > 5 * 1024 * 1024) {
        alert("Max file size 5MB");
        return;
      }

      setPdfFile(file);
      setLoading(true);
      const url = await uploadImageToStorage(file);
      setLoading(false);

      if (url) {
        setPdfUrl(url);
        // Load image to get actual dimensions
        const img = new Image();
        img.onload = () => {
          setPdfDimensions({ width: img.naturalWidth, height: img.naturalHeight });
        };
        img.onerror = () => {
          console.error("Failed to load image dimensions");
          // Fallback to default landscape
          setPdfDimensions({ width: 800, height: 560 });
        };
        img.src = url;
      }
    };

  // ============================
  // FIELD ACTIONS
  // ============================
  const addField = () => {
    setFields((prev) => [
      ...prev,
      {
        id: Date.now().toString(),
        type: "text",
        label: "New Field",
        x: 60,
        y: 120,
        width: 200,
        height: 36,
      },
    ]);
  };

  // NEW — add QR code (static content)
  const addQrCode = async () => {
    try {
      // static value as per Option A
      const qrData = "STATIC-QR-CODE";
      const qrDataUrl = await QRCode.toDataURL(qrData, { margin: 1 });

      setFields((prev) => [
        ...prev,
        {
          id: Date.now().toString(),
          type: "qr",
          qrImage: qrDataUrl,
          x: 100,
          y: 120,
          width: 120,
          height: 120,
        },
      ]);
    } catch (err) {
      console.error("QR generation failed", err);
      alert("Failed to generate QR code");
    }
  };

  const removeField = (id) => {
    setFields((prev) => prev.filter((f) => f.id !== id));
  };

  const updateLabel = (id, label) => {
    setFields((prev) => prev.map((f) => (f.id === id ? { ...f, label } : f)));
  };

  // ============================
  // DRAG / RESIZE HANDLERS (scaled-aware)
  // ============================
  useEffect(() => {
    const onMove = (e) => {
    const clientX = e.touches ? e.touches[0].clientX : e.clientX;
    const clientY = e.touches ? e.touches[0].clientY : e.clientY;

    const rect = previewRef.current?.getBoundingClientRect();
    if (!rect) return;

    // DRAG
    if (draggingRef.current.id) {
      const { id, offsetX, offsetY } = draggingRef.current;

      const displayedWidth = rect.width;
      const displayedHeight = rect.height;

      let newDisplayedX = clientX - rect.left - offsetX;
      let newDisplayedY = clientY - rect.top - offsetY;

      // REMOVED CLAMPING - Allow fields to move anywhere
      // No Math.max or Math.min restrictions

      // Convert displayed pixels back to base coords
      const baseX = Math.round((newDisplayedX / displayedWidth) * pdfDimensions.width);
      const baseY = Math.round((newDisplayedY / displayedHeight) * pdfDimensions.height);

      setFields((prev) => 
        prev.map((f) => (f.id === id ? { ...f, x: baseX, y: baseY } : f))
      );
    }

    // RESIZE (bottom-right corner only implemented)
    if (resizingRef.current.id) {
      const { id, startDisplayW, startDisplayH, startX, startY, corner } = resizingRef.current;
      const dx = clientX - startX;
      const dy = clientY - startY;

      const displayedWidth = rect.width;
      const displayedHeight = rect.height;

      setFields((prev) =>
        prev.map((f) => {
          if (f.id !== id) return f;

          let newDisplayW = startDisplayW;
          let newDisplayH = startDisplayH;

          if (corner === "br") {
            newDisplayW = Math.max(30, startDisplayW + dx);
            newDisplayH = Math.max(20, startDisplayH + dy);
          }

          // convert back to base units
          const baseW = Math.round((newDisplayW / displayedWidth) * pdfDimensions.width);
          const baseH = Math.round((newDisplayH / displayedHeight) * pdfDimensions.height);

          return { ...f, width: baseW, height: baseH };
        })
      );
    }
  };

    const onUp = () => {
      draggingRef.current = { id: null, offsetX: 0, offsetY: 0 };
      resizingRef.current = { id: null };
    };

    window.addEventListener("mousemove", onMove);
    window.addEventListener("mouseup", onUp);
    window.addEventListener("touchmove", onMove, { passive: false });
    window.addEventListener("touchend", onUp);

    return () => {
      window.removeEventListener("mousemove", onMove);
      window.removeEventListener("mouseup", onUp);
      window.removeEventListener("touchmove", onMove);
      window.removeEventListener("touchend", onUp);
    };
  }, []);

  const startDrag = (e, id) => {
    e.stopPropagation();
    const clientX = e.touches ? e.touches[0].clientX : e.clientX;
    const clientY = e.touches ? e.touches[0].clientY : e.clientY;

    const rect = previewRef.current?.getBoundingClientRect();
    if (!rect) return;

    const field = fields.find((f) => f.id === id);
    if (!field) return;

    // compute displayed position of field from base coordinates
    const displayedX = (field.x / 800) * rect.width;
    const displayedY = (field.y / 560) * rect.height;

    const offsetX = clientX - rect.left - displayedX;
    const offsetY = clientY - rect.top - displayedY;

    draggingRef.current = { id, offsetX, offsetY };
  };

  const startResize = (e, id, corner) => {
    e.stopPropagation();
    const clientX = e.touches ? e.touches[0].clientX : e.clientX;
    const clientY = e.touches ? e.touches[0].clientY : e.clientY;

    const rect = previewRef.current?.getBoundingClientRect();
    if (!rect) return;

    const field = fields.find((f) => f.id === id);
    if (!field) return;

    // compute displayed sizes
    const startDisplayW = (field.width / 800) * rect.width;
    const startDisplayH = (field.height / 560) * rect.height;

    resizingRef.current = {
      id,
      startDisplayW,
      startDisplayH,
      startX: clientX,
      startY: clientY,
      corner,
    };
  };

  // ============================
  // COPY + SHARE
  // ============================
  const copyJoinCode = () => {
    if (!deployedGroup?.joinCode) return;
    navigator.clipboard.writeText(deployedGroup.joinCode);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const shareLink = () => {
    if (!deployedGroup?.joinCode) return;
    const url = `${window.location.origin}/join/${deployedGroup.joinCode}`;
    navigator.clipboard.writeText(url);
    alert("Share link copied to clipboard!");
  };

  // ============================
  // DEPLOY GROUP (saves fields including qr)
  // ============================
  const deployGroup = async () => {
    setLoading(true);
    try {
      // 1️⃣ Get logged-in user
      const { data: sessionData } = await supabase.auth.getSession();
      const user = sessionData?.session?.user;
      if (!user) throw new Error("Not authenticated");

      // 2️⃣ Ensure instructor exists (creates if missing)
      const instructorSetup = await walletService.registerInstructor({
        userId: user.id
      });

      if (!instructorSetup.success) {
        throw new Error("Instructor setup failed");
      }

      // 3️⃣ 🔴 PASTE YOUR BLOCK RIGHT HERE 🔴
      const { data: instructor, error: instructorError } = await supabase
        .from("instructors")
        .select("id")
        .eq("user_id", user.id)
        .single();

      if (instructorError || !instructor) {
        throw new Error("Instructor not registered");
      }

      // 4️⃣ Continue normally
      const joinCode = generateJoinCode();

      const { data: groupData, error: groupError } = await supabase
        .from("groups")
        .insert({
          name: courseTitle,
          description,
          created_by: user.id,
          instructor_id: instructor.id, // ✅ uses fetched instructor
          max_learners: learners,
          status: "active",
          join_code: joinCode
        })
        .select()
        .single();

    if (groupError) throw groupError;

    // ---- rest of your code stays EXACTLY the same ----


      let templateId = null;

      if (pdfUrl) {
        const { data: templateData, error: templateError } = await supabase
          .from("certificate_templates")
          .insert([
            {
              group_id: groupData.id,
              pdf_url: pdfUrl,
              created_by: user.id,
            },
          ])
          .select()
          .single();
        if (templateError) throw templateError;

        templateId = templateData.id;
      }

      if (templateId && fields.length) {
        const payload = fields.map((f) => ({
          template_id: templateId,
          label: f.type === "text" ? f.label : "QR Code", // ✅ NEVER NULL
          type: f.type || "text",
          qr_image: f.type === "qr" ? f.qrImage : null,
          x: Math.round(f.x),
          y: Math.round(f.y),
          width: Math.round(f.width),
          height: Math.round(f.height),
        }));


        const { error: fieldsError } = await supabase.from("template_fields").insert(payload);
        if (fieldsError) throw fieldsError;
      }

      if (templateId) {
        const { error: updateErr } = await supabase
          .from("groups")
          .update({ template_id: templateId })
          .eq("id", groupData.id);
        if (updateErr) throw updateErr;
      }

      setDeployedGroup({
        groupId: groupData.id,
        joinCode,
      });

      setCurrentStep(4);
    } catch (err) {
      alert("Deploy failed: " + (err.message || JSON.stringify(err)));
    } finally {
      setLoading(false);
    }
  };

  // ---------------------------------------------------
  // RENDER
  // ---------------------------------------------------
  return (
    <DashboardLayout>
      <div className="max-w-6xl mx-auto space-y-8">
        
        <Button
          variant="ghost"
          className="mb-4 text-slate-600 hover:text-slate-900"
          onClick={() => window.history.back()}
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back to Dashboard
        </Button>

        <h1 className="text-4xl font-bold text-slate-900 mb-4">
          Create Certificate Group
        </h1>

        {/* SUBSCRIPTION LIMIT WARNING */}
        {subscriptionStatus && !canCreateGroup && (
          <Card className="border-2 border-orange-300 bg-orange-50">
            <CardContent className="p-6">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-orange-100 rounded-xl flex items-center justify-center">
                  <AlertTriangle className="w-6 h-6 text-orange-600" />
                </div>
                <div className="flex-1">
                  <h3 className="font-bold text-orange-800 mb-1">Group Limit Reached</h3>
                  <p className="text-orange-700 text-sm">
                    You have created {subscriptionStatus.groups_created} of {subscriptionStatus.groups_limit} groups allowed on the Free plan.
                    Upgrade to Pro for unlimited group creation.
                  </p>
                </div>
                <Link to="/pricing">
                  <Button className="bg-purple-600 hover:bg-purple-700 text-white">
                    <Crown className="w-4 h-4 mr-2" />
                    Upgrade to Pro
                  </Button>
                </Link>
              </div>
            </CardContent>
          </Card>
        )}

        {/* SUBSCRIPTION STATUS BANNER */}
        {subscriptionStatus && canCreateGroup && !subscriptionStatus.is_pro && (
          <Card className="border border-blue-200 bg-blue-50">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <Badge className="bg-slate-100 text-slate-700">Free Plan</Badge>
                  <span className="text-sm text-slate-600">
                    Groups: {subscriptionStatus.groups_created}/{subscriptionStatus.groups_limit} • 
                    Mint Credits: {subscriptionStatus.mint_credits}
                  </span>
                </div>
                <Link to="/pricing" className="text-sm text-purple-600 hover:text-purple-700 font-medium flex items-center gap-1">
                  <Crown className="w-4 h-4" />
                  Upgrade for unlimited
                </Link>
              </div>
            </CardContent>
          </Card>
        )}

        {/* STEP 1 */}
        {currentStep === 1 && canCreateGroup && (
          <Card data-aos="fade-up">
            <CardContent className="p-8 space-y-6">
              <div>
                <Label className="text-lg font-semibold text-slate-900 mb-2 block">
                  Course Title
                </Label>
                <Input
                  placeholder="e.g., Web Development Bootcamp"
                  className="py-6 text-lg rounded-xl"
                  value={courseTitle}
                  onChange={(e) => setCourseTitle(e.target.value)}
                />
              </div>

              <div>
                <Label className="text-lg font-semibold text-slate-900 mb-2 block">
                  Description
                </Label>
                <Textarea
                  rows={4}
                  className="text-lg rounded-xl"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                />
              </div>

              <div>
                <Label className="text-lg font-semibold text-slate-900 mb-2 block">
                  Number of Learners
                </Label>
                <Input
                  type="number"
                  className="py-6 text-lg rounded-xl"
                  value={learners}
                  onChange={(e) => setLearners(Number(e.target.value))}
                />
              </div>

              <div className="flex justify-end">
                <Button
                  onClick={() => setCurrentStep(2)}
                  className="bg-blue-600 text-white px-8 py-6 rounded-xl"
                >
                  Continue to Template Designer
                  <ArrowRight className="ml-2" />
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {/* STEP 2 (Designer) */}
        {currentStep === 2 && (
          <div className="space-y-6" data-aos="fade-up">
            <Card>
              <CardContent className="p-8">
                <h2 className="text-2xl font-bold text-slate-900 mb-6">Upload Certificate Background</h2>
                <div
                  className="border-2 border-dashed border-slate-300 rounded-xl p-8 text-center hover:border-blue-500 transition-colors cursor-pointer"
                  onClick={() => fileInputRef.current?.click()}
                >
                  <Upload className="w-12 h-12 text-slate-400 mx-auto mb-4" />
                  <p className="text-lg text-slate-700 font-medium mb-2">
                    {loading ? "Uploading..." : "Click to upload or drag and drop"}
                  </p>
                  <p className="text-sm text-slate-500">JPG/JPEG images only (Max 5MB)</p>
                  {pdfFile && <p className="text-sm text-green-600 mt-2">✓ {pdfFile.name} selected</p>}
                  <input ref={fileInputRef} type="file" accept="image/jpeg,image/jpg,.jpg,.jpeg" className="hidden" onChange={onSelectFile} />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-8">
                <div className="flex items-center justify-between mb-6">
                  <h2 className="text-2xl font-bold text-slate-900">Design Your Template</h2>
                  <div className="flex items-center gap-3">
                    <Button onClick={addField} className="bg-blue-600 hover:bg-blue-700 text-white rounded-xl">
                      <Plus className="w-4 h-4 mr-2" />
                      Add Field
                    </Button>

                    {/* Add QR Code button */}
                    <Button onClick={addQrCode} className="bg-purple-600 hover:bg-purple-700 text-white rounded-xl">
                      <Plus className="w-4 h-4 mr-2" />
                      Add QR Code
                    </Button>

                    <Button variant="outline" onClick={() => setFields([{ id: Date.now().toString(), type: "text", label: "Recipient Name", x: 50, y: 80, width: 250, height: 36 }])}>
                      Reset Fields
                    </Button>
                  </div>
                </div>
                <div className="bg-slate-100 rounded-xl p-4 min-h-[400px] relative border-2 border-slate-300">
                  <div 
                    ref={previewRef} 
                    className="relative mx-auto bg-white shadow-md rounded-md" 
                    style={{ 
                      width: "100%",
                      maxWidth: "800px",
                      aspectRatio: `${pdfDimensions.width} / ${pdfDimensions.height}`,
                      overflow: "visible"  // CHANGED from "hidden" to "visible"
                    }}
                  >
                    {pdfUrl ? (
                      <>
                        <img 
                          src={pdfUrl}
                          alt="Certificate Template"
                          style={{ 
                            position: 'absolute', 
                            top: 0, 
                            left: 0,
                            width: '100%', 
                            height: '100%',
                            objectFit: 'contain',
                            pointerEvents: 'none',
                            zIndex: 1
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
                                background: f.type === "qr" ? "transparent" : "rgba(219, 234, 254, 0.9)",
                                border: "2px solid #3b82f6",
                                borderRadius: 8,
                                boxSizing: "border-box",
                                zIndex: 100,  // CHANGED: Much higher z-index to be above everything
                                display: "flex",
                                flexDirection: "column",
                                padding: 0,
                                cursor: "move",  // ADDED: Show move cursor
                                pointerEvents: "auto"  // ADDED: Ensure fields are clickable
                              }}
                            >
                                              {f.type === "text" ? (
                                <div onMouseDown={(e) => startDrag(e, f.id)} onTouchStart={(e) => startDrag(e, f.id)} className="flex items-center gap-2 p-2" style={{ flex: 1 }}>
                                  <GripVertical className="w-4 h-4 text-blue-600" />
                                  <input value={f.label} onChange={(e) => updateLabel(f.id, e.target.value)} onClick={(e) => e.stopPropagation()} className="bg-transparent border-none outline-none text-blue-900 text-sm font-medium flex-1" />
                                  <button onClick={(e) => { e.stopPropagation(); removeField(f.id); }} className="ml-1 hover:bg-red-100 rounded p-1">
                                    <Trash2 className="w-4 h-4 text-red-600" />
                                  </button>
                                </div>
                              ) : (
                                <div style={{ width: "100%", height: "100%", position: "relative" }}>
                                  <img src={f.qrImage} alt="qr" draggable={false} style={{ width: "100%", height: "100%", objectFit: "contain", pointerEvents: 'none' }} />
                                  <button onClick={(e) => { e.stopPropagation(); removeField(f.id); }} style={{ position: 'absolute', top: 6, right: 6, background: 'rgba(255,255,255,0.9)', borderRadius: 6, padding: 4 }}>
                                    <Trash2 className="w-4 h-4 text-red-600" />
                                  </button>
                                  {/* allow dragging from image area */}
                                  <div onMouseDown={(e) => startDrag(e, f.id)} onTouchStart={(e) => startDrag(e, f.id)} style={{ position: 'absolute', inset: 0, cursor: 'move' }} />
                                </div>
                              )}

                              {/* resize handle */}
                              <div onMouseDown={(e) => startResize(e, f.id, "br")} onTouchStart={(e) => startResize(e, f.id, "br")}
                                style={{
                                  position: "absolute",
                                  bottom: -6,
                                  right: -6,
                                  width: 12,
                                  height: 12,
                                  background: "#3b82f6",
                                  border: "2px solid white",
                                  borderRadius: "50%",
                                  cursor: "nwse-resize",
                                  zIndex: 20,
                                }}
                              />
                            </div>
                          );
                        })}
                      </>
                    ) : (
                      <div className="h-full flex items-center justify-center text-slate-400">
                        <div className="text-center">
                          <Upload className="mx-auto mb-2 w-12 h-12" />
                          <div className="text-sm">Upload a JPG image to preview the template</div>
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                <div className="space-y-3 mt-6">
                  <h3 className="font-semibold text-slate-900">Template Fields ({fields.length})</h3>
                  {fields.map((f) => (
                    <div key={f.id} className="flex items-center gap-3 p-3 bg-slate-50 rounded-lg">
                      <GripVertical className="w-5 h-5 text-slate-400" />
                      <div className="flex-1">
                        {f.type === "text" ? <Input value={f.label} onChange={(e) => updateLabel(f.id, e.target.value)} className="rounded-lg" /> : <div className="text-sm">QR Code</div>}
                      </div>
                      <div className="text-sm text-slate-600">x:{Math.round(f.x)} y:{Math.round(f.y)} w:{Math.round(f.width)} h:{Math.round(f.height)}</div>
                      <Button size="icon" variant="ghost" className="hover:bg-red-100" onClick={() => removeField(f.id)}>
                        <Trash2 className="w-4 h-4 text-red-600" />
                      </Button>
                    </div>
                  ))}
                </div>

                <div className="flex justify-between pt-6">
                  <Button variant="outline" onClick={() => setCurrentStep(1)} className="px-8 py-6 rounded-xl">
                    <ArrowLeft className="mr-2 w-5 h-5" />
                    Back
                  </Button>
                  <Button onClick={() => setCurrentStep(3)} className="bg-blue-600 hover:bg-blue-700 text-white px-8 py-6 rounded-xl">
                    Continue to Finalize
                    <ArrowRight className="ml-2 w-5 h-5" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* STEP 3: Preview & Deploy */}
        {currentStep === 3 && (
          <div className="space-y-6" data-aos="fade-up">
            <Card>
              <CardContent className="p-8">
                <h2 className="text-2xl font-bold text-slate-900 mb-6">Certificate Preview</h2>
                <div className="bg-slate-100 rounded-xl p-4 border-2 border-slate-300">
                      <div 
                        className="relative mx-auto bg-white shadow-md rounded-md" 
                        style={{ 
                          width: "100%",
                          maxWidth: "800px",
                          aspectRatio: `${pdfDimensions.width} / ${pdfDimensions.height}`,
                          overflow: "hidden" 
                        }}
                      >
                    {pdfUrl ? (
                      <>
                        <img 
                          src={pdfUrl}
                          alt="Certificate Preview"
                          style={{ 
                            position: 'absolute', 
                            top: 0, 
                            left: 0,
                            width: '100%', 
                            height: '100%',
                            objectFit: 'contain',
                            pointerEvents: 'none'
                          }}
                        />
                        {fields.map((f) => {
                        const leftPct = (f.x / pdfDimensions.width) * 100;
                        const topPct = (f.y / pdfDimensions.height) * 100;
                        const widthPct = (f.width / pdfDimensions.width) * 100;
                        const heightPct = (f.height / pdfDimensions.height) * 100;

                        return (
                          <div key={f.id} style={{
                            position: "absolute",
                            left: `${leftPct}%`,
                            top: `${topPct}%`,
                            width: `${widthPct}%`,
                            height: `${heightPct}%`,
                            background: f.type === "qr" ? "transparent" : "rgba(219, 234, 254, 0.7)",
                            border: "2px solid #3b82f6",
                            borderRadius: 8,
                            boxSizing: "border-box",
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            zIndex: 10,
                            // Remove padding that shifts content
                            padding: 0,
                          }}>
                            {f.type === "text" ? (
                              <span className="text-blue-900 text-sm font-medium" style={{
                                padding: "6px 8px",
                                width: "100%",
                                textAlign: "center"
                              }}>
                                {f.label}
                              </span>
                            ) : (
                              <img 
                                src={f.qrImage} 
                                alt="qr" 
                                style={{ 
                                  width: "100%", 
                                  height: "100%", 
                                  objectFit: "contain" 
                                }} 
                              />
                            )}
                          </div>
                        );
                      })}

                      </>
                    ) : (
                      <div className="h-full flex items-center justify-center text-slate-400">
                        <div className="text-center">
                          <Upload className="mx-auto mb-2 w-12 h-12" />
                          <div className="text-sm">No template uploaded</div>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="bg-gradient-to-br from-blue-50 to-white border-2 border-blue-200">
              <CardContent className="p-8">
                <h2 className="text-2xl font-bold text-slate-900 mb-4">Ready to Deploy?</h2>
                <p className="text-slate-600 mb-6">Once deployed, you'll receive a unique join code that learners can use to claim their certificates.</p>
                <div className="flex justify-between">
                  <Button variant="outline" onClick={() => setCurrentStep(2)} className="px-8 py-6 rounded-xl">
                    <ArrowLeft className="mr-2 w-5 h-5" />
                    Back
                  </Button>
                  <div className="flex items-center gap-3">
                    <Button variant="outline" onClick={openFullPreview} className="px-6 py-3">
                      <ExternalLink className="w-4 h-4 mr-2" />
                      Open Full Preview
                    </Button>
                    <Button className="bg-green-600 hover:bg-green-700 text-white px-8 py-6 rounded-xl shadow-lg" onClick={deployGroup} disabled={loading}>
                      {loading ? "Deploying..." : <>
                        <Check className="mr-2 w-5 h-5" />
                        Deploy Group
                      </>}
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* STEP 4: Success */}
        {currentStep === 4 && deployedGroup && (
          <div className="space-y-6" data-aos="fade-up">
            <Card className="bg-gradient-to-br from-green-50 to-white border-2 border-green-200">
              <CardContent className="p-8 text-center">
                <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
                  <CheckCircle className="w-12 h-12 text-green-600" />
                </div>
                <h2 className="text-3xl font-bold text-slate-900 mb-4">Group Deployed Successfully!</h2>
                <p className="text-slate-600 mb-8">Your certificate group is now live. Share the join code below with your learners.</p>

                <div className="max-w-md mx-auto space-y-4">
                  <div className="bg-white rounded-xl p-6 border-2 border-green-300">
                    <Label className="text-sm text-slate-600 mb-2 block">Join Code</Label>
                    <div className="flex items-center gap-3">
                      <div className="flex-1 bg-slate-100 rounded-lg px-4 py-3 font-mono text-2xl font-bold text-slate-900 tracking-wider">
                        {deployedGroup.joinCode}
                      </div>
                      <Button onClick={copyJoinCode} className="bg-blue-600 hover:bg-blue-700 text-white">
                        {copied ? <Check className="w-5 h-5" /> : <Copy className="w-5 h-5" />}
                      </Button>
                    </div>
                  </div>

                  <div className="flex gap-3">
                    <Button onClick={shareLink} variant="outline" className="flex-1 py-6 rounded-xl">
                      <Share2 className="w-5 h-5 mr-2" />
                      Share Link
                    </Button>
                    <Button onClick={() => navigate(`/dashboard/my-groups/${deployedGroup.groupId}`)} className="flex-1 bg-blue-600 hover:bg-blue-700 text-white py-6 rounded-xl">
                      View Group Details
                    </Button>
                  </div>

                  <Button onClick={() => navigate('/dashboard')} variant="ghost" className="w-full">
                    Back to Dashboard
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        )}

      </div>
    </DashboardLayout>
  );
};

export default CreateCertificatePage;
