import React, { useState, useEffect } from 'react';
import { Wallet, Plus, CheckCircle, AlertCircle, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent } from '@/components/ui/card';
import { walletService } from '@/services/walletService';
import { supabase } from '@/supabaseClient';
import { toast } from 'sonner';

export const WalletConnect = () => {
  const [user, setUser] = useState(null);
  const [wallet, setWallet] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showDialog, setShowDialog] = useState(false);
  const [generatingWallet, setGeneratingWallet] = useState(false);

  useEffect(() => {
    loadUserWallet();
  }, []);

  const loadUserWallet = async () => {
    try {
      setLoading(true);
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.user) return;

      setUser(session.user);

      // Check if wallet exists
      const userWallet = await walletService.getUserWallet(session.user.id);
      setWallet(userWallet);

    } catch (error) {
      console.error('Error loading wallet:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleGenerateWallet = async () => {
    if (!user) {
      toast.error('Please sign in first');
      return;
    }

    setGeneratingWallet(true);
    try {
      const result = await walletService.generateWallet(user.id, user.email);
      
      if (result.success) {
        setWallet(result.wallet);
        setShowDialog(false);
        toast.success('Wallet created successfully! 🎉');
        
        // Show wallet address
        toast.info(`Your wallet: ${result.address.substring(0, 10)}...`, {
          duration: 5000
        });
      } else {
        toast.error('Failed to create wallet: ' + result.error);
      }
    } catch (error) {
      console.error('Error:', error);
      toast.error('Failed to create wallet');
    } finally {
      setGeneratingWallet(false);
    }
  };

  const handleConnectExternal = async () => {
    // For external wallets like MetaMask
    if (typeof window.ethereum === 'undefined') {
      toast.error('Please install MetaMask or another Web3 wallet');
      return;
    }

    try {
      const accounts = await window.ethereum.request({ 
        method: 'eth_requestAccounts' 
      });
      const walletAddress = accounts[0];

      const result = await walletService.connectExternalWallet(user.id, walletAddress);
      
      if (result.success) {
        setWallet(result.wallet);
        setShowDialog(false);
        toast.success('Wallet connected successfully! 🎉');
      } else {
        toast.error('Failed to connect wallet: ' + result.error);
      }
    } catch (error) {
      console.error('Error:', error);
      toast.error('Failed to connect wallet');
    }
  };

  if (loading) {
    return (
      <Button variant="ghost" size="sm" disabled>
        <Loader2 className="w-4 h-4 animate-spin" />
      </Button>
    );
  }

  return (
    <>
      {/* Wallet Status Button */}
      {wallet ? (
        <Button
          variant="outline"
          size="sm"
          className="gap-2 border-green-200 bg-green-50 hover:bg-green-100"
          onClick={() => setShowDialog(true)}
        >
          <CheckCircle className="w-4 h-4 text-green-600" />
          <span className="hidden sm:inline text-green-700">
            {wallet.wallet_address.substring(0, 6)}...
            {wallet.wallet_address.substring(wallet.wallet_address.length - 4)}
          </span>
        </Button>
      ) : (
        <Button
          variant="outline"
          size="sm"
          className="gap-2 border-orange-200 bg-orange-50 hover:bg-orange-100"
          onClick={() => setShowDialog(true)}
        >
          <Wallet className="w-4 h-4 text-orange-600" />
          <span className="hidden sm:inline text-orange-700">Connect Wallet</span>
        </Button>
      )}

      {/* Wallet Dialog */}
      <Dialog open={showDialog} onOpenChange={setShowDialog}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Wallet className="w-5 h-5" />
              {wallet ? 'Your Wallet' : 'Connect Wallet'}
            </DialogTitle>
            <DialogDescription>
              {wallet 
                ? 'Manage your blockchain wallet for certificate signing'
                : 'Create a new wallet or connect an existing one'
              }
            </DialogDescription>
          </DialogHeader>

          {wallet ? (
            // Show existing wallet
            <div className="space-y-4">
              <Card className="bg-slate-50 border-slate-200">
                <CardContent className="p-4">
                  <div className="space-y-3">
                    <div>
                      <Label className="text-xs text-slate-600">Wallet Address</Label>
                      <div className="flex items-center gap-2 mt-1">
                        <code className="text-sm font-mono bg-white px-3 py-2 rounded border flex-1 overflow-x-auto">
                          {wallet.wallet_address}
                        </code>
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => {
                            navigator.clipboard.writeText(wallet.wallet_address);
                            toast.success('Address copied!');
                          }}
                        >
                          Copy
                        </Button>
                      </div>
                    </div>

                    <div>
                      <Label className="text-xs text-slate-600">Provider</Label>
                      <p className="text-sm font-medium capitalize mt-1">
                        {wallet.wallet_provider}
                      </p>
                    </div>

                    <div>
                      <Label className="text-xs text-slate-600">Created</Label>
                      <p className="text-sm font-medium mt-1">
                        {new Date(wallet.created_at).toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <div className="flex gap-3">
                  <CheckCircle className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
                  <div className="text-sm text-blue-800">
                    <p className="font-medium mb-1">Wallet Connected</p>
                    <p>This wallet will be used to sign certificates you issue.</p>
                  </div>
                </div>
              </div>
            </div>
          ) : (
            // Create/Connect options
            <div className="space-y-4">
              
              {/* Generate New Wallet */}
              <Card className="border-2 border-dashed hover:border-blue-500 hover:bg-blue-50 transition-all cursor-pointer">
                <CardContent className="p-6" onClick={handleGenerateWallet}>
                  <div className="flex items-start gap-4">
                    <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center flex-shrink-0">
                      <Plus className="w-6 h-6 text-blue-600" />
                    </div>
                    <div className="flex-1">
                      <h3 className="font-semibold text-slate-900 mb-1">
                        Generate New Wallet
                      </h3>
                      <p className="text-sm text-slate-600">
                        Create a new blockchain wallet automatically. We'll securely store it for you.
                      </p>
                      {generatingWallet && (
                        <div className="mt-3 flex items-center gap-2 text-blue-600">
                          <Loader2 className="w-4 h-4 animate-spin" />
                          <span className="text-sm">Generating wallet...</span>
                        </div>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Connect External Wallet */}
              <Card className="border-2 border-dashed hover:border-purple-500 hover:bg-purple-50 transition-all cursor-pointer">
                <CardContent className="p-6" onClick={handleConnectExternal}>
                  <div className="flex items-start gap-4">
                    <div className="w-12 h-12 bg-purple-100 rounded-xl flex items-center justify-center flex-shrink-0">
                      <Wallet className="w-6 h-6 text-purple-600" />
                    </div>
                    <div className="flex-1">
                      <h3 className="font-semibold text-slate-900 mb-1">
                        Connect Existing Wallet
                      </h3>
                      <p className="text-sm text-slate-600">
                        Connect MetaMask or another Web3 wallet you already own.
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Info Box */}
              <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
                <div className="flex gap-3">
                  <AlertCircle className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
                  <div className="text-sm text-amber-800">
                    <p className="font-medium mb-1">Why do I need a wallet?</p>
                    <p>
                      Your wallet is used to cryptographically sign certificates, 
                      proving their authenticity. This makes them tamper-proof and verifiable.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
};

export default WalletConnect;