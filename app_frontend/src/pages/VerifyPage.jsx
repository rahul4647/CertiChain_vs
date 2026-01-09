import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { 
  Award, 
  CheckCircle2, 
  XCircle, 
  Shield, 
  Clock, 
  User, 
  Mail, 
  BookOpen,
  Hash,
  FileText,
  ExternalLink,
  Copy,
  Check,
  AlertTriangle,
  Loader2
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL || 'http://localhost:8001';

export const VerifyPage = () => {
  const { certificateId } = useParams();
  const [verificationData, setVerificationData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    verifyTheCertificate();
  }, [certificateId]);

  const verifyTheCertificate = async () => {
    try {
      setLoading(true);
      setError(null);

      const response = await fetch(`${BACKEND_URL}/api/certificates/verify/${certificateId}`);
      
      if (!response.ok) {
        throw new Error('Failed to verify certificate');
      }

      const data = await response.json();
      setVerificationData(data);

      // Log the verification
      await fetch(`${BACKEND_URL}/api/certificates/verify/${certificateId}/log`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          trust_score: data.trustScore,
          user_agent: navigator.userAgent
        })
      }).catch(() => {}); // Silently fail logging

    } catch (err) {
      console.error('Verification error:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const copyToClipboard = (text) => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const getStatusIcon = (status) => {
    if (status?.includes('✅') || status?.includes('VERIFIED') || status?.includes('MINTED')) {
      return <CheckCircle2 className="w-5 h-5 text-green-600" />;
    } else if (status?.includes('❌') || status?.includes('INVALID') || status?.includes('TAMPERED')) {
      return <XCircle className="w-5 h-5 text-red-600" />;
    } else if (status?.includes('⏳') || status?.includes('PENDING')) {
      return <Clock className="w-5 h-5 text-yellow-600" />;
    }
    return <AlertTriangle className="w-5 h-5 text-gray-600" />;
  };

  const getStatusColor = (status) => {
    if (status?.includes('✅') || status?.includes('VERIFIED') || status?.includes('MINTED')) {
      return 'bg-green-100 text-green-800 border-green-300';
    } else if (status?.includes('❌') || status?.includes('INVALID') || status?.includes('TAMPERED')) {
      return 'bg-red-100 text-red-800 border-red-300';
    } else if (status?.includes('⏳') || status?.includes('PENDING')) {
      return 'bg-yellow-100 text-yellow-800 border-yellow-300';
    }
    return 'bg-gray-100 text-gray-800 border-gray-300';
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-slate-100 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-16 h-16 text-blue-600 animate-spin mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-slate-900 mb-2">Verifying Certificate</h2>
          <p className="text-slate-600">Please wait while we verify the authenticity...</p>
        </div>
      </div>
    );
  }

  if (error || !verificationData) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-red-50 to-slate-100 flex items-center justify-center px-4">
        <Card className="max-w-lg w-full border-red-200 shadow-xl">
          <CardContent className="p-8 text-center">
            <div className="w-20 h-20 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-6">
              <XCircle className="w-12 h-12 text-red-600" />
            </div>
            <h1 className="text-3xl font-bold text-slate-900 mb-4">Certificate Not Found</h1>
            <p className="text-slate-600 mb-6">
              {error || 'The certificate you are looking for could not be verified.'}
            </p>
            <p className="text-sm text-slate-500 mb-6">
              Certificate ID: <code className="bg-slate-100 px-2 py-1 rounded">{certificateId}</code>
            </p>
            <Link to="/">
              <Button className="bg-blue-600 hover:bg-blue-700 text-white">
                Return Home
              </Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    );
  }

  const { certificate, verification, blockchain, storage, trustScore, verified } = verificationData;

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-slate-100">
      {/* Header */}
      <header className="bg-white border-b border-slate-200 shadow-sm">
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
          <Link to="/" className="flex items-center gap-3">
            <div className="w-10 h-10 bg-blue-600 rounded-xl flex items-center justify-center">
              <Award className="w-6 h-6 text-white" />
            </div>
            <h1 className="text-2xl font-bold text-slate-900">CertiChain</h1>
          </Link>
          <Badge className={verified 
            ? 'bg-green-100 text-green-800 text-sm px-4 py-2' 
            : 'bg-yellow-100 text-yellow-800 text-sm px-4 py-2'
          }>
            <Shield className="w-4 h-4 mr-1" />
            {verified ? 'Verified' : 'Pending Verification'}
          </Badge>
        </div>
      </header>

      <div className="max-w-5xl mx-auto px-6 py-12">
        
        {/* Main Verification Status */}
        <Card className={`mb-8 border-2 shadow-xl ${verified ? 'border-green-300 bg-gradient-to-br from-green-50 to-white' : 'border-yellow-300 bg-gradient-to-br from-yellow-50 to-white'}`}>
          <CardContent className="p-8">
            <div className="flex flex-col md:flex-row items-center gap-6">
              <div className={`w-24 h-24 rounded-full flex items-center justify-center ${verified ? 'bg-green-100' : 'bg-yellow-100'}`}>
                {verified ? (
                  <CheckCircle2 className="w-14 h-14 text-green-600" />
                ) : (
                  <Clock className="w-14 h-14 text-yellow-600" />
                )}
              </div>
              <div className="flex-1 text-center md:text-left">
                <h1 className="text-3xl font-bold text-slate-900 mb-2">
                  {verified ? 'Certificate Verified ✓' : 'Verification In Progress'}
                </h1>
                <p className="text-slate-600 mb-4">
                  {verified 
                    ? 'This certificate is authentic and has been verified on the blockchain.'
                    : 'Some verification checks are still pending. The certificate is being processed.'
                  }
                </p>
                <div className="flex items-center justify-center md:justify-start gap-4">
                  <div className="text-center">
                    <div className={`text-4xl font-bold ${trustScore >= 80 ? 'text-green-600' : trustScore >= 60 ? 'text-yellow-600' : 'text-red-600'}`}>
                      {trustScore}%
                    </div>
                    <div className="text-sm text-slate-500">Trust Score</div>
                  </div>
                  <div className="h-12 w-px bg-slate-300"></div>
                  <div className="text-center">
                    <div className="text-sm text-slate-500">Certificate ID</div>
                    <code className="text-sm font-mono bg-slate-100 px-2 py-1 rounded">{certificateId}</code>
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Certificate Details Grid */}
        <div className="grid md:grid-cols-2 gap-6 mb-8">
          
          {/* Recipient Information */}
          <Card className="shadow-lg">
            <CardHeader className="border-b border-slate-200 bg-slate-50">
              <CardTitle className="flex items-center gap-2 text-lg">
                <User className="w-5 h-5 text-blue-600" />
                Recipient Information
              </CardTitle>
            </CardHeader>
            <CardContent className="p-6 space-y-4">
              <div>
                <label className="text-sm text-slate-500">Full Name</label>
                <p className="text-lg font-semibold text-slate-900">{certificate?.recipient?.name || 'N/A'}</p>
              </div>
              {certificate?.recipient?.email && (
                <div>
                  <label className="text-sm text-slate-500">Email</label>
                  <p className="text-slate-700 flex items-center gap-2">
                    <Mail className="w-4 h-4 text-slate-400" />
                    {certificate.recipient.email}
                  </p>
                </div>
              )}
              {certificate?.recipient?.studentId && (
                <div>
                  <label className="text-sm text-slate-500">Student ID</label>
                  <p className="text-slate-700">{certificate.recipient.studentId}</p>
                </div>
              )}
              {certificate?.recipient?.wallet && certificate.recipient.wallet !== 'pending' && (
                <div>
                  <label className="text-sm text-slate-500">Wallet Address</label>
                  <p className="text-slate-700 font-mono text-sm break-all">{certificate.recipient.wallet}</p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Course Information */}
          <Card className="shadow-lg">
            <CardHeader className="border-b border-slate-200 bg-slate-50">
              <CardTitle className="flex items-center gap-2 text-lg">
                <BookOpen className="w-5 h-5 text-purple-600" />
                Course Information
              </CardTitle>
            </CardHeader>
            <CardContent className="p-6 space-y-4">
              <div>
                <label className="text-sm text-slate-500">Course Name</label>
                <p className="text-lg font-semibold text-slate-900">{certificate?.course?.name || 'N/A'}</p>
              </div>
              <div>
                <label className="text-sm text-slate-500">Completion Date</label>
                <p className="text-slate-700">{certificate?.course?.completionDate || 'N/A'}</p>
              </div>
              <div>
                <label className="text-sm text-slate-500">Issued By</label>
                <p className="text-slate-700 flex items-center gap-2">
                  {certificate?.issuer?.name || 'Instructor'}
                  {certificate?.issuer?.verified && (
                    <CheckCircle2 className="w-4 h-4 text-green-600" />
                  )}
                </p>
              </div>
              {certificate?.issuer?.wallet && (
                <div>
                  <label className="text-sm text-slate-500">Issuer Wallet</label>
                  <p className="text-slate-700 font-mono text-xs break-all">{certificate.issuer.wallet}</p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Verification Checks */}
        <Card className="mb-8 shadow-lg">
          <CardHeader className="border-b border-slate-200 bg-slate-50">
            <CardTitle className="flex items-center gap-2 text-lg">
              <Shield className="w-5 h-5 text-green-600" />
              Verification Checks
            </CardTitle>
          </CardHeader>
          <CardContent className="p-6">
            <div className="grid md:grid-cols-2 gap-4">
              
              {/* Data Integrity */}
              <div className={`p-4 rounded-xl border-2 ${getStatusColor(verification?.dataIntegrity?.status)}`}>
                <div className="flex items-center gap-3 mb-2">
                  {getStatusIcon(verification?.dataIntegrity?.status)}
                  <span className="font-semibold">Data Integrity</span>
                </div>
                <p className="text-sm opacity-90">{verification?.dataIntegrity?.message}</p>
              </div>

              {/* Issuer Signature */}
              <div className={`p-4 rounded-xl border-2 ${getStatusColor(verification?.issuerSignature?.status)}`}>
                <div className="flex items-center gap-3 mb-2">
                  {getStatusIcon(verification?.issuerSignature?.status)}
                  <span className="font-semibold">Issuer Signature</span>
                </div>
                <p className="text-sm opacity-90">{verification?.issuerSignature?.message}</p>
              </div>

              {/* Blockchain NFT */}
              <div className={`p-4 rounded-xl border-2 ${getStatusColor(verification?.blockchainNFT?.status)}`}>
                <div className="flex items-center gap-3 mb-2">
                  {getStatusIcon(verification?.blockchainNFT?.status)}
                  <span className="font-semibold">Blockchain NFT</span>
                </div>
                <p className="text-sm opacity-90">{verification?.blockchainNFT?.message}</p>
                {verification?.blockchainNFT?.chain && (
                  <p className="text-xs mt-1 opacity-75">Chain: {verification.blockchainNFT.chain}</p>
                )}
              </div>

              {/* Receiver Ownership */}
              <div className={`p-4 rounded-xl border-2 ${getStatusColor(verification?.receiverOwnership?.status)}`}>
                <div className="flex items-center gap-3 mb-2">
                  {getStatusIcon(verification?.receiverOwnership?.status)}
                  <span className="font-semibold">Receiver Ownership</span>
                </div>
                <p className="text-sm opacity-90">{verification?.receiverOwnership?.message}</p>
              </div>

            </div>
          </CardContent>
        </Card>

        {/* Blockchain Details */}
        {blockchain && (blockchain.contractAddress || blockchain.tokenId || blockchain.transactionHash) && (
          <Card className="mb-8 shadow-lg">
            <CardHeader className="border-b border-slate-200 bg-slate-50">
              <CardTitle className="flex items-center gap-2 text-lg">
                <Hash className="w-5 h-5 text-indigo-600" />
                Blockchain Details
              </CardTitle>
            </CardHeader>
            <CardContent className="p-6 space-y-4">
              <div className="grid md:grid-cols-2 gap-4">
                {blockchain.chain && (
                  <div>
                    <label className="text-sm text-slate-500">Network</label>
                    <p className="text-slate-900 font-semibold capitalize">{blockchain.chain}</p>
                  </div>
                )}
                {blockchain.tokenId && blockchain.tokenId !== 'pending' && (
                  <div>
                    <label className="text-sm text-slate-500">Token ID</label>
                    <p className="text-slate-900 font-mono">{blockchain.tokenId}</p>
                  </div>
                )}
              </div>
              
              {blockchain.contractAddress && blockchain.contractAddress !== 'pending' && (
                <div>
                  <label className="text-sm text-slate-500">Contract Address</label>
                  <div className="flex items-center gap-2">
                    <code className="text-sm font-mono bg-slate-100 px-3 py-2 rounded flex-1 break-all">
                      {blockchain.contractAddress}
                    </code>
                    <Button 
                      variant="ghost" 
                      size="sm"
                      onClick={() => copyToClipboard(blockchain.contractAddress)}
                    >
                      {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                    </Button>
                  </div>
                </div>
              )}
              
              {blockchain.transactionHash && blockchain.transactionHash !== 'pending' && (
                <div>
                  <label className="text-sm text-slate-500">Transaction Hash</label>
                  <div className="flex items-center gap-2">
                    <code className="text-sm font-mono bg-slate-100 px-3 py-2 rounded flex-1 break-all">
                      {blockchain.transactionHash}
                    </code>
                    {blockchain.explorerUrl && (
                      <a 
                        href={blockchain.explorerUrl} 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="text-blue-600 hover:text-blue-700"
                      >
                        <ExternalLink className="w-4 h-4" />
                      </a>
                    )}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        )}

        {/* Certificate Image */}
        {storage?.imageUrl && (
          <Card className="mb-8 shadow-lg">
            <CardHeader className="border-b border-slate-200 bg-slate-50">
              <CardTitle className="flex items-center gap-2 text-lg">
                <FileText className="w-5 h-5 text-orange-600" />
                Certificate Image
              </CardTitle>
            </CardHeader>
            <CardContent className="p-6">
              <div className="bg-slate-100 rounded-xl p-4">
                <img 
                  src={storage.imageUrl} 
                  alt="Certificate" 
                  className="w-full rounded-lg shadow-md"
                  onError={(e) => {
                    e.target.style.display = 'none';
                  }}
                />
              </div>
              <div className="mt-4 flex justify-center">
                <a 
                  href={storage.imageUrl} 
                  target="_blank" 
                  rel="noopener noreferrer"
                >
                  <Button className="bg-blue-600 hover:bg-blue-700 text-white">
                    <ExternalLink className="w-4 h-4 mr-2" />
                    View Full Image
                  </Button>
                </a>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Footer */}
        <div className="text-center text-slate-500 text-sm">
          <p>This verification was performed on {new Date().toLocaleString()}</p>
          <p className="mt-2">
            Powered by <Link to="/" className="text-blue-600 hover:underline">CertiChain</Link> - Blockchain Verified Certificates
          </p>
        </div>

      </div>
    </div>
  );
};

export default VerifyPage;
