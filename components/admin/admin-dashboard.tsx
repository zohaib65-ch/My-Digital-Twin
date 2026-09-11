'use client';

import { useState, useEffect, useCallback } from 'react';
import {
  Database,
  RefreshCw,
  FileText,
  Hash,
  Clock,
  Loader2,
  CheckCircle,
  XCircle,
  Lock,
  ArrowLeft,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import type { AdminStats, IngestionStats } from '@/lib/types';
import Link from 'next/link';

export function AdminDashboard() {
  const [secret, setSecret] = useState('');
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [stats, setStats] = useState<AdminStats | null>(null);
  const [isLoadingStats, setIsLoadingStats] = useState(false);
  const [isIngesting, setIsIngesting] = useState(false);
  const [ingestionResult, setIngestionResult] = useState<IngestionStats | null>(null);
  const [error, setError] = useState<string | null>(null);

  const fetchStats = useCallback(async () => {
    setIsLoadingStats(true);
    setError(null);
    try {
      const response = await fetch('/api/admin/stats', {
        headers: { 'x-admin-secret': secret },
      });
      if (!response.ok) {
        const data = await response.json().catch(() => ({}));
        throw new Error(data.error || 'Failed to fetch stats');
      }
      const data: AdminStats = await response.json();
      setStats(data);
      setIsAuthenticated(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch stats');
    } finally {
      setIsLoadingStats(false);
    }
  }, [secret]);

  const triggerIngestion = async () => {
    setIsIngesting(true);
    setIngestionResult(null);
    setError(null);
    try {
      const response = await fetch('/api/ingest', {
        method: 'POST',
        headers: { 'x-admin-secret': secret },
      });
      if (!response.ok) {
        const data = await response.json().catch(() => ({}));
        throw new Error(data.error || 'Ingestion failed');
      }
      const data = await response.json();
      setIngestionResult(data.stats);
      // Refresh stats after ingestion
      await fetchStats();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Ingestion failed');
    } finally {
      setIsIngesting(false);
    }
  };

  // Auto-refresh stats when authenticated
  useEffect(() => {
    if (isAuthenticated) {
      fetchStats();
    }
  }, [isAuthenticated, fetchStats]);

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <Card className="w-full max-w-md glass-card border-border/30">
          <CardHeader className="text-center">
            <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-brand to-glow flex items-center justify-center mx-auto mb-4">
              <Lock className="w-7 h-7 text-white" />
            </div>
            <CardTitle className="text-xl">Admin Access</CardTitle>
            <p className="text-sm text-muted-foreground mt-1">
              Enter your admin secret to manage the knowledge base.
            </p>
          </CardHeader>
          <CardContent className="space-y-4">
            <Input
              type="password"
              placeholder="Enter admin secret..."
              value={secret}
              onChange={(e) => setSecret(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && fetchStats()}
              className="bg-muted/30"
            />
            {error && (
              <p className="text-sm text-destructive flex items-center gap-1.5">
                <XCircle className="w-4 h-4" />
                {error}
              </p>
            )}
            <Button
              onClick={fetchStats}
              disabled={!secret || isLoadingStats}
              className="w-full bg-brand hover:bg-brand-dark"
            >
              {isLoadingStats ? (
                <Loader2 className="w-4 h-4 animate-spin mr-2" />
              ) : (
                <Lock className="w-4 h-4 mr-2" />
              )}
              Authenticate
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen p-4 md:p-8">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-3">
            <Link href="/">
              <Button variant="ghost" size="icon" className="h-8 w-8 rounded-lg">
                <ArrowLeft className="w-4 h-4" />
              </Button>
            </Link>
            <div>
              <h1 className="text-2xl font-bold">Knowledge Base Admin</h1>
              <p className="text-sm text-muted-foreground">
                Manage documents, trigger ingestion, monitor the system.
              </p>
            </div>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={fetchStats}
            disabled={isLoadingStats}
          >
            <RefreshCw
              className={`w-4 h-4 mr-2 ${isLoadingStats ? 'animate-spin' : ''}`}
            />
            Refresh
          </Button>
        </div>

        {/* Stats Cards */}
        {stats && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
            <Card className="glass-card border-border/30">
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-blue-500/10 flex items-center justify-center">
                    <FileText className="w-5 h-5 text-blue-400" />
                  </div>
                  <div>
                    <p className="text-2xl font-bold">{stats.totalDocuments}</p>
                    <p className="text-xs text-muted-foreground">Documents</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="glass-card border-border/30">
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-purple-500/10 flex items-center justify-center">
                    <Hash className="w-5 h-5 text-purple-400" />
                  </div>
                  <div>
                    <p className="text-2xl font-bold">{stats.totalChunks}</p>
                    <p className="text-xs text-muted-foreground">Chunks</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="glass-card border-border/30">
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-green-500/10 flex items-center justify-center">
                    <Database className="w-5 h-5 text-green-400" />
                  </div>
                  <div>
                    <p className="text-2xl font-bold">
                      {Object.keys(stats.categories).length}
                    </p>
                    <p className="text-xs text-muted-foreground">Categories</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="glass-card border-border/30">
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-orange-500/10 flex items-center justify-center">
                    <Clock className="w-5 h-5 text-orange-400" />
                  </div>
                  <div>
                    <p className="text-sm font-bold truncate">
                      {stats.lastIngestion
                        ? new Date(stats.lastIngestion).toLocaleDateString()
                        : 'Never'}
                    </p>
                    <p className="text-xs text-muted-foreground">Last Ingested</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Category Breakdown */}
        {stats && Object.keys(stats.categories).length > 0 && (
          <Card className="glass-card border-border/30 mb-8">
            <CardHeader>
              <CardTitle className="text-base">Category Breakdown</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex flex-wrap gap-2">
                {Object.entries(stats.categories)
                  .sort(([, a], [, b]) => b - a)
                  .map(([category, count]) => (
                    <Badge
                      key={category}
                      variant="secondary"
                      className="text-sm py-1 px-3"
                    >
                      {category}: {count} chunks
                    </Badge>
                  ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Ingestion */}
        <Card className="glass-card border-border/30 mb-8">
          <CardHeader>
            <CardTitle className="text-base">Document Ingestion</CardTitle>
            <p className="text-sm text-muted-foreground">
              Process knowledge documents, generate embeddings, and store in MongoDB.
            </p>
          </CardHeader>
          <CardContent className="space-y-4">
            <Button
              onClick={triggerIngestion}
              disabled={isIngesting}
              className="bg-brand hover:bg-brand-dark"
            >
              {isIngesting ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin mr-2" />
                  Ingesting...
                </>
              ) : (
                <>
                  <RefreshCw className="w-4 h-4 mr-2" />
                  Run Ingestion
                </>
              )}
            </Button>

            {ingestionResult && (
              <div className="rounded-lg bg-green-500/10 border border-green-500/20 p-4 animate-fade-in">
                <div className="flex items-center gap-2 mb-3">
                  <CheckCircle className="w-5 h-5 text-green-400" />
                  <span className="font-medium text-green-400">
                    Ingestion Complete
                  </span>
                </div>
                <div className="grid grid-cols-2 gap-2 text-sm">
                  <div>
                    <span className="text-muted-foreground">Documents: </span>
                    {ingestionResult.totalDocuments}
                  </div>
                  <div>
                    <span className="text-muted-foreground">Total Chunks: </span>
                    {ingestionResult.totalChunks}
                  </div>
                  <div>
                    <span className="text-muted-foreground">New: </span>
                    {ingestionResult.newChunks}
                  </div>
                  <div>
                    <span className="text-muted-foreground">Skipped: </span>
                    {ingestionResult.skippedChunks}
                  </div>
                  <div>
                    <span className="text-muted-foreground">Deleted: </span>
                    {ingestionResult.deletedChunks}
                  </div>
                </div>
              </div>
            )}

            {error && (
              <div className="rounded-lg bg-destructive/10 border border-destructive/20 p-4 text-sm text-destructive flex items-center gap-2">
                <XCircle className="w-4 h-4 shrink-0" />
                {error}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
