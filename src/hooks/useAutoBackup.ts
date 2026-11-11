import { useState, useEffect, useCallback } from 'react';
import { backupService, type SnapshotSummary } from '../services/backupService';

export function useAutoBackup() {
  const [snapshots, setSnapshots] = useState<SnapshotSummary[]>(() => backupService.getLocalSnapshots());
  const [isSnapshotting, setIsSnapshotting] = useState(false);
  const [lastSnapshot, setLastSnapshot] = useState<SnapshotSummary | null>(() => {
    const list = backupService.getLocalSnapshots();
    return list.length > 0 ? list[0] : null;
  });

  const refreshSnapshots = useCallback(() => {
    const list = backupService.getLocalSnapshots();
    setSnapshots(list);
    if (list.length > 0) {
      setLastSnapshot(list[0]);
    }
  }, []);

  const triggerSnapshot = useCallback(async (reason = 'Manual Trigger') => {
    setIsSnapshotting(true);
    try {
      const snap = await backupService.createAutoSnapshot(reason);
      refreshSnapshots();
      return snap;
    } finally {
      setIsSnapshotting(false);
    }
  }, [refreshSnapshots]);

  useEffect(() => {
    // Auto-snapshot every 60 minutes while app is running
    const intervalMs = 60 * 60 * 1000;
    const timer = setInterval(() => {
      triggerSnapshot('Periodic 1-Hour Auto-Snapshot');
    }, intervalMs);

    return () => clearInterval(timer);
  }, [triggerSnapshot]);

  return {
    snapshots,
    lastSnapshot,
    isSnapshotting,
    triggerSnapshot,
    refreshSnapshots
  };
}
