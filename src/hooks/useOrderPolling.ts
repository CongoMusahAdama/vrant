import { useEffect } from 'react';

type UseOrderPollingOptions = {
  enabled: boolean;
  intervalMs: number;
  onPoll: (options: { notify: boolean; silent: boolean }) => void | Promise<void>;
  token?: string | null;
};

export function useOrderPolling({
  enabled,
  intervalMs,
  onPoll,
  token,
}: UseOrderPollingOptions) {
  useEffect(() => {
    if (!enabled || !token) return;

    const id = window.setInterval(() => {
      // Hidden tabs don't poll; the visibility handler below catches up when the tab returns
      if (document.visibilityState !== 'visible') return;
      void onPoll({ notify: true, silent: true });
    }, intervalMs);

    return () => window.clearInterval(id);
  }, [enabled, intervalMs, onPoll, token]);

  useEffect(() => {
    if (!enabled || !token) return;

    const onVisible = () => {
      if (document.visibilityState === 'visible') {
        void onPoll({ notify: true, silent: true });
      }
    };

    document.addEventListener('visibilitychange', onVisible);
    return () => document.removeEventListener('visibilitychange', onVisible);
  }, [enabled, onPoll, token]);
}
