'use client';
import { useCallback } from 'react';
import { useAnalysisStore, useAuthStore } from '@/lib/store';
import { runAnalysis, getCachedAnalysis, clearAnalysis } from '@/lib/api';
import { DateRange } from '@/types';
import toast from 'react-hot-toast';

export function useAnalysis() {
  const { analysis, isLoading, error, dateRange, lastUpdated, setAnalysis, setLoading, setError, setDateRange, clearAnalysis: clearStore } = useAnalysisStore();
  const { sessionId } = useAuthStore();

  const fetchAnalysis = useCallback(
    async (forceRefresh = false) => {
      if (!sessionId) {
        setError('No active session. Please log in.');
        return;
      }
      setLoading(true);
      setError(null);

      try {
        if (!forceRefresh) {
          const cached = await getCachedAnalysis();
          if (cached) {
            setAnalysis(cached);
            return;
          }
        }

        const toastId = toast.loading('Scraping live data from all platforms...', {
          style: { background: '#0d0d1e', color: '#e0e0e0', border: '1px solid rgba(0,255,136,0.2)' },
        });

        const result = await runAnalysis({
          date_range: dateRange,
          session_id: sessionId,
          force_refresh: forceRefresh,
        });

        toast.success('Analysis complete!', { id: toastId, style: { background: '#0d0d1e', color: '#00ff88' } });
        setAnalysis(result);
      } catch (err: unknown) {
        const msg = err instanceof Error ? err.message : 'Analysis failed';
        setError(msg);
        toast.error(msg, { style: { background: '#0d0d1e', color: '#ff3b3b' } });
      }
    },
    [sessionId, dateRange, setAnalysis, setLoading, setError]
  );

  const refresh = useCallback(() => fetchAnalysis(true), [fetchAnalysis]);

  const changeDateRange = useCallback(
    (range: DateRange) => {
      setDateRange(range);
    },
    [setDateRange]
  );

  const resetAnalysis = useCallback(async () => {
    try {
      await clearAnalysis();
      clearStore();
    } catch {
      clearStore();
    }
  }, [clearStore]);

  return {
    analysis,
    isLoading,
    error,
    dateRange,
    lastUpdated,
    fetchAnalysis,
    refresh,
    changeDateRange,
    resetAnalysis,
  };
}
