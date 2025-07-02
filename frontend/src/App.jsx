import React, { useState, useEffect } from 'react';
import { AuthClient } from '@dfinity/auth-client';
import { createActor } from 'declarations/backend';
import { canisterId } from 'declarations/backend/index.js';
import { Principal } from '@dfinity/principal';

const network = process.env.DFX_NETWORK;
const identityProvider =
  network === 'ic'
    ? 'https://identity.ic0.app' // Mainnet
    : 'http://rdmx6-jaaaa-aaaaa-aaadq-cai.localhost:4943'; // Local

const App = () => {
  const [state, setState] = useState({
    actor: undefined,
    authClient: undefined,
    isAuthenticated: false,
    principal: ''
  });
  const [status, setStatus] = useState(null);
  const [loading, setLoading] = useState(false);
  const [backupWallet, setBackupWallet] = useState('');
  const [timeoutDays, setTimeoutDays] = useState(30);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [hasAccount, setHasAccount] = useState(false);
  const [checkingAccount, setCheckingAccount] = useState(false);

  // Initialize auth client
  useEffect(() => {
    updateActor();
  }, []);

  const updateActor = async () => {
    try {
      const authClient = await AuthClient.create();
      const identity = authClient.getIdentity();
      const actor = createActor(canisterId, {
        agentOptions: {
          identity
        }
      });
      const isAuthenticated = await authClient.isAuthenticated();
      
      let principal = '';
      if (isAuthenticated) {
        const principalResult = identity.getPrincipal();
        principal = principalResult.toString();
      }

      setState((prev) => ({
        ...prev,
        actor,
        authClient,
        isAuthenticated,
        principal
      }));

      // Check if user has an account and fetch status if authenticated
      if (isAuthenticated && actor) {
        await checkUserAccount(actor, Principal.fromText(principal));
      }
    } catch (err) {
      console.error('Failed to initialize:', err);
      setError('Failed to initialize application');
    }
  };

  const checkUserAccount = async (actor = state.actor, userPrincipal = null) => {
    if (!actor) return;
    
    setCheckingAccount(true);
    try {
      const principal = userPrincipal || Principal.fromText(state.principal);
      const exists = await actor.userExists(principal);
      setHasAccount(exists);
      
      if (exists) {
        await fetchStatusInternal(actor);
      }
    } catch (err) {
      console.error('Failed to check user account:', err);
      setHasAccount(false);
    } finally {
      setCheckingAccount(false);
    }
  };

  const copyToClipboard = async (text) => {
    try {
      await navigator.clipboard.writeText(text);
      setSuccess('Principal ID copied to clipboard!');
      setTimeout(() => setSuccess(''), 3000);
    } catch (err) {
      console.error('Failed to copy to clipboard:', err);
      setError('Failed to copy to clipboard');
      setTimeout(() => setError(''), 3000);
    }
  };

  const login = async () => {
    setLoading(true);
    try {
      await state.authClient.login({
        identityProvider,
        onSuccess: () => {
          updateActor();
          setSuccess('Successfully logged in!');
          setTimeout(() => setSuccess(''), 3000);
        }
      });
    } catch (err) {
      console.error('Login failed:', err);
      setError('Failed to login');
    } finally {
      setLoading(false);
    }
  };

  const logout = async () => {
    setLoading(true);
    try {
      await state.authClient.logout();
      setStatus(null);
      setHasAccount(false);
      updateActor();
      setSuccess('Successfully logged out!');
      setTimeout(() => setSuccess(''), 3000);
    } catch (err) {
      console.error('Logout failed:', err);
      setError('Failed to logout');
    } finally {
      setLoading(false);
    }
  };

  const initializeAccount = async () => {
    if (!state.isAuthenticated || !state.actor) return;
    
    setLoading(true);
    try {
      const result = await state.actor.initializeUser();
      
      if ('ok' in result) {
        setSuccess(result.ok);
        setTimeout(() => setSuccess(''), 3000);
        setHasAccount(true);
        await fetchStatusInternal(); // Fetch the new account status
      } else {
        setError(result.err);
      }
    } catch (err) {
      console.error('Initialize account failed:', err);
      setError('Failed to initialize account');
    } finally {
      setLoading(false);
    }
  };

  const fetchStatusInternal = async (actor = state.actor) => {
    if (!actor) return;
    
    try {
      const result = await actor.getMyStatus();
      
      if ('ok' in result) {
        const userData = result.ok;
        // Convert BigInt values to regular numbers for display
        const processedStatus = {
          owner: userData.owner.toString(),
          backupWallet: userData.backupWallet.length > 0 ? userData.backupWallet[0].toString() : null,
          lastPing: Number(userData.lastPing) / 1000000, // Convert nanoseconds to milliseconds
          timeout: Number(userData.timeout)
        };
        setStatus(processedStatus);
        console.log('Status fetched:', processedStatus);
      } else {
        setError(result.err);
        setHasAccount(false);
      }
    } catch (err) {
      console.error('Failed to fetch status:', err);
      setError('Failed to fetch account status');
    }
  };

  const fetchStatus = async () => {
    if (!state.isAuthenticated || !state.actor) return;
    
    setLoading(true);
    try {
      await fetchStatusInternal();
    } finally {
      setLoading(false);
    }
  };

  const ping = async () => {
    if (!state.isAuthenticated || !state.actor) return;
    
    setLoading(true);
    try {
      const result = await state.actor.ping();
      
      if ('ok' in result) {
        setSuccess(result.ok);
        setTimeout(() => setSuccess(''), 3000);
        await fetchStatusInternal(); // Refresh status
      } else {
        setError(result.err);
      }
    } catch (err) {
      console.error('Ping failed:', err);
      setError('Failed to ping');
    } finally {
      setLoading(false);
    }
  };

  const setBackup = async () => {
    if (!state.isAuthenticated || !state.actor || !backupWallet) return;
    
    setLoading(true);
    try {
      // Convert string to Principal using the proper Principal library
      const backupPrincipal = Principal.fromText(backupWallet);
      const result = await state.actor.setBackup(backupPrincipal);
      
      if ('ok' in result) {
        setSuccess(result.ok);
        setTimeout(() => setSuccess(''), 3000);
        setBackupWallet('');
        await fetchStatusInternal(); // Refresh status
      } else {
        setError(result.err);
      }
    } catch (err) {
      console.error('Set backup failed:', err);
      setError('Failed to set backup wallet - make sure the principal is valid');
    } finally {
      setLoading(false);
    }
  };

  const setTimeoutFunc = async () => {
    if (!state.isAuthenticated || !state.actor || timeoutDays < 1) return;
    
    setLoading(true);
    try {
      // Convert days to nanoseconds
      const timeoutNanoseconds = timeoutDays * 24 * 60 * 60 * 1000 * 1000000;
      const result = await state.actor.setTimeout(timeoutNanoseconds);
      
      if ('ok' in result) {
        setSuccess(result.ok);
        setTimeout(() => setSuccess(''), 3000);
        await fetchStatusInternal(); // Refresh status
      } else {
        setError(result.err);
      }
    } catch (err) {
      console.error('Set timeout failed:', err);
      setError('Failed to set timeout');
    } finally {
      setLoading(false);
    }
  };

  const claimOwnership = async () => {
    if (!state.isAuthenticated || !state.actor) return;
    
    setLoading(true);
    try {
      // For claiming, we need to specify the original owner
      const originalOwner = Principal.fromText(status.owner);
      const result = await state.actor.claim(originalOwner);
      
      if ('ok' in result) {
        setSuccess(result.ok);
        setTimeout(() => setSuccess(''), 3000);
        await fetchStatusInternal(); // Refresh status
      } else {
        setError(result.err);
      }
    } catch (err) {
      console.error('Claim failed:', err);
      setError('Failed to claim ownership');
    } finally {
      setLoading(false);
    }
  };

  const formatPrincipal = (principal) => {
    if (!principal) return '';
    return `${principal.slice(0, 8)}...${principal.slice(-8)}`;
  };

  const formatTime = (timestamp) => {
    return new Date(timestamp).toLocaleString();
  };

  const getTimeRemaining = () => {
    if (!status) return null;
    
    const timeoutMs = Number(status.timeout) / 1000000; // Convert nanoseconds to milliseconds
    const deadline = status.lastPing + timeoutMs;
    const remaining = deadline - Date.now();
    
    if (remaining <= 0) return 'EXPIRED';
    
    const days = Math.floor(remaining / (1000 * 60 * 60 * 24));
    const hours = Math.floor((remaining % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
    
    return `${days}d ${hours}h`;
  };

  const isExpired = () => {
    if (!status) return false;
    const timeoutMs = Number(status.timeout) / 1000000;
    const deadline = status.lastPing + timeoutMs;
    return Date.now() > deadline;
  };

  const isBackupWallet = () => {
    return status && status.backupWallet && state.principal === status.backupWallet;
  };

  const isOwner = () => {
    return status && state.principal === status.owner;
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="text-center mb-12">
          <div className="flex items-center justify-center mb-4">
            <span className="text-4xl mr-3">🛡️</span>
            <h1 className="text-4xl font-bold text-white">LastPing</h1>
          </div>
          <p className="text-slate-300 text-lg">Personal Dead Man's Switch for Internet Computer</p>
        </div>

        {/* Alert Messages */}
        {error && (
          <div className="mb-6 p-4 bg-red-900/50 border border-red-500 rounded-lg flex items-center">
            <span className="text-red-400 mr-3">⚠️</span>
            <span className="text-red-200">{error}</span>
            <button 
              onClick={() => setError('')}
              className="ml-auto text-red-400 hover:text-red-300 text-xl"
            >
              ×
            </button>
          </div>
        )}

        {success && (
          <div className="mb-6 p-4 bg-green-900/50 border border-green-500 rounded-lg flex items-center">
            <span className="text-green-400 mr-3">✅</span>
            <span className="text-green-200">{success}</span>
          </div>
        )}

        {/* Connection Status */}
        <div className="bg-slate-800/50 backdrop-blur-sm rounded-xl p-6 mb-8 border border-slate-700">
          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <span className="text-purple-400 mr-3 text-xl">💼</span>
              <div>
                <h3 className="text-white font-semibold">Internet Identity</h3>
                {state.isAuthenticated ? (
                  <div className="flex items-center gap-2">
                    <p className="text-slate-300 text-sm">Connected: {formatPrincipal(state.principal)}</p>
                    <button
                      onClick={() => copyToClipboard(state.principal)}
                      className="bg-slate-600 hover:bg-slate-700 text-white px-2 py-1 rounded text-xs transition-colors"
                      title="Copy your full principal ID"
                    >
                      📋
                    </button>
                  </div>
                ) : (
                  <p className="text-slate-400 text-sm">Not connected</p>
                )}
              </div>
            </div>
            {!state.isAuthenticated ? (
              <button
                onClick={login}
                disabled={loading}
                className="bg-purple-600 hover:bg-purple-700 disabled:opacity-50 text-white px-6 py-2 rounded-lg font-medium transition-colors"
              >
                {loading ? 'Connecting...' : 'Login with Internet Identity'}
              </button>
            ) : (
              <div className="flex gap-3">
                <button
                  onClick={fetchStatus}
                  disabled={loading || !hasAccount}
                  className="bg-slate-600 hover:bg-slate-700 disabled:opacity-50 text-white px-4 py-2 rounded-lg font-medium transition-colors"
                >
                  Refresh
                </button>
                <button
                  onClick={logout}
                  disabled={loading}
                  className="bg-red-600 hover:bg-red-700 disabled:opacity-50 text-white px-4 py-2 rounded-lg font-medium transition-colors"
                >
                  Logout
                </button>
              </div>
            )}
          </div>
        </div>

        {state.isAuthenticated && (
          <>
            {/* Account Initialization */}
            {!hasAccount && !checkingAccount && (
              <div className="bg-slate-800/50 backdrop-blur-sm rounded-xl p-6 mb-8 border border-slate-700 text-center">
                <span className="text-purple-400 text-6xl mb-4 block">🎯</span>
                <h3 className="text-white text-xl font-semibold mb-4">Welcome to LastPing!</h3>
                <p className="text-slate-300 mb-6">
                  You don't have a LastPing account yet. Create one to get started with your personal dead man's switch.
                </p>
                <button
                  onClick={initializeAccount}
                  disabled={loading}
                  className="bg-purple-600 hover:bg-purple-700 disabled:opacity-50 text-white px-8 py-3 rounded-lg font-medium transition-colors"
                >
                  {loading ? 'Creating Account...' : 'Create My LastPing Account'}
                </button>
              </div>
            )}

            {checkingAccount && (
              <div className="bg-slate-800/50 backdrop-blur-sm rounded-xl p-6 mb-8 border border-slate-700 text-center">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-400 mx-auto mb-4"></div>
                <p className="text-slate-300">Checking your account...</p>
              </div>
            )}

            {/* Status Display */}
            {status && hasAccount && (
              <div className="bg-slate-800/50 backdrop-blur-sm rounded-xl p-6 mb-8 border border-slate-700">
                <h3 className="text-white text-xl font-semibold mb-4 flex items-center">
                  <span className="text-purple-400 mr-3 text-xl">⏰</span>
                  Your LastPing Status
                </h3>
                
                <div className="grid md:grid-cols-2 gap-6">
                  <div>
                    <div className="mb-4">
                      <label className="text-slate-300 text-sm">Owner</label>
                      <div className="flex items-center gap-2">
                        <p className="flex-1 text-white font-mono text-sm bg-slate-700 p-2 rounded">
                          {formatPrincipal(status.owner)}
                        </p>
                        <button
                          onClick={() => copyToClipboard(status.owner)}
                          className="bg-slate-600 hover:bg-slate-700 text-white px-3 py-2 rounded text-xs transition-colors"
                          title="Copy full principal ID"
                        >
                          📋 Copy
                        </button>
                      </div>
                      {isOwner() && (
                        <p className="text-green-400 text-xs mt-1">👑 This is you</p>
                      )}
                    </div>
                    
                    <div className="mb-4">
                      <label className="text-slate-300 text-sm">Backup Wallet</label>
                      <div className="flex items-center gap-2">
                        <p className="flex-1 text-white font-mono text-sm bg-slate-700 p-2 rounded">
                          {status.backupWallet ? formatPrincipal(status.backupWallet) : 'Not set'}
                        </p>
                        {status.backupWallet && (
                          <button
                            onClick={() => copyToClipboard(status.backupWallet)}
                            className="bg-slate-600 hover:bg-slate-700 text-white px-3 py-2 rounded text-xs transition-colors"
                            title="Copy full principal ID"
                          >
                            📋 Copy
                          </button>
                        )}
                      </div>
                      {isBackupWallet() && (
                        <p className="text-orange-400 text-xs mt-1">🔄 This is you (backup)</p>
                      )}
                    </div>
                  </div>
                  
                  <div>
                    <div className="mb-4">
                      <label className="text-slate-300 text-sm">Last Ping</label>
                      <p className="text-white text-sm bg-slate-700 p-2 rounded">
                        {formatTime(status.lastPing)}
                      </p>
                    </div>
                    
                    <div className="mb-4">
                      <label className="text-slate-300 text-sm">Time Remaining</label>
                      <p className={`text-sm font-semibold p-2 rounded ${
                        isExpired() ? 'text-red-400 bg-red-900/30' : 'text-green-400 bg-green-900/30'
                      }`}>
                        {getTimeRemaining()}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="flex flex-wrap gap-3 mt-6">
                  {isOwner() && (
                    <button
                      onClick={ping}
                      disabled={loading}
                      className="bg-green-600 hover:bg-green-700 disabled:opacity-50 text-white px-6 py-2 rounded-lg font-medium transition-colors"
                    >
                      {loading ? 'Pinging...' : 'Ping Now'}
                    </button>
                  )}
                  
                  {isBackupWallet() && isExpired() && (
                    <button
                      onClick={claimOwnership}
                      disabled={loading}
                      className="bg-orange-600 hover:bg-orange-700 disabled:opacity-50 text-white px-6 py-2 rounded-lg font-medium transition-colors"
                    >
                      {loading ? 'Claiming...' : 'Claim Ownership'}
                    </button>
                  )}
                </div>
              </div>
            )}

            {/* Settings */}
            {hasAccount && (
              <div className="bg-slate-800/50 backdrop-blur-sm rounded-xl p-6 border border-slate-700">
                <h3 className="text-white text-xl font-semibold mb-4 flex items-center">
                  <span className="text-purple-400 mr-3 text-xl">⚙️</span>
                  My Settings
                </h3>
                
                {isOwner() ? (
                  <div className="space-y-6">
                    {/* Principal ID Sharing Section */}
                    <div className="p-4 bg-blue-900/30 border border-blue-600 rounded-lg">
                      <h4 className="text-blue-400 font-semibold mb-2 flex items-center">
                        <span className="mr-2">🔗</span>
                        Share Your Principal ID
                      </h4>
                      <p className="text-slate-300 text-sm mb-3">
                        Give this Principal ID to someone you trust to set as your backup wallet:
                      </p>
                      <div className="flex items-center gap-2">
                        <input
                          type="text"
                          value={state.principal}
                          readOnly
                          className="flex-1 bg-slate-700 text-white p-2 rounded font-mono text-sm border border-slate-600"
                        />
                        <button
                          onClick={() => copyToClipboard(state.principal)}
                          className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded font-medium transition-colors"
                        >
                          📋 Copy
                        </button>
                      </div>
                    </div>

                    {/* Settings Controls */}
                    <div className="grid md:grid-cols-2 gap-6">
                      <div>
                        <label className="block text-slate-300 text-sm mb-2">Set Backup Wallet</label>
                        <div className="flex gap-2">
                          <input
                            type="text"
                            value={backupWallet}
                            onChange={(e) => setBackupWallet(e.target.value)}
                            placeholder="Enter principal ID..."
                            className="flex-1 bg-slate-700 text-white p-3 rounded-lg border border-slate-600 focus:border-purple-500 focus:outline-none"
                          />
                          <button
                            onClick={setBackup}
                            disabled={loading || !backupWallet}
                            className="bg-purple-600 hover:bg-purple-700 disabled:opacity-50 text-white px-4 py-3 rounded-lg font-medium transition-colors"
                          >
                            Set
                          </button>
                        </div>
                      </div>
                      
                      <div>
                        <label className="block text-slate-300 text-sm mb-2">Timeout (Days)</label>
                        <div className="flex gap-2">
                          <input
                            type="number"
                            value={timeoutDays}
                            onChange={(e) => setTimeoutDays(Number(e.target.value))}
                            min="1"
                            max="365"
                            className="flex-1 bg-slate-700 text-white p-3 rounded-lg border border-slate-600 focus:border-purple-500 focus:outline-none"
                          />
                          <button
                            onClick={setTimeoutFunc}
                            disabled={loading || timeoutDays < 1}
                            className="bg-purple-600 hover:bg-purple-700 disabled:opacity-50 text-white px-4 py-3 rounded-lg font-medium transition-colors"
                          >
                            Set
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <span className="text-slate-400 text-lg">🔒</span>
                    <p className="text-slate-400 mt-2">
                      {isBackupWallet() 
                        ? "You are the backup wallet for this account. You can claim ownership when the timer expires."
                        : "This account belongs to someone else. You can only view the status."
                      }
                    </p>
                  </div>
                )}
              </div>
            )}
          </>
        )}

        {/* Footer */}
        <div className="text-center mt-12 text-slate-400">
          <p>Built on Internet Computer Protocol • Personal Dead Man's Switch</p>
        </div>
      </div>
    </div>
  );
};

export default App;