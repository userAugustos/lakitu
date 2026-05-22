import { useCallback, useEffect, useRef, useState } from 'react';

interface UseCopyToClipboardOptions {
  resetAfterMs?: number;
  idleMessage?: string;
  copiedMessage?: string;
}

export function useCopyToClipboard({
  resetAfterMs = 2000,
  idleMessage = 'Copy',
  copiedMessage = 'Copied!',
}: UseCopyToClipboardOptions = {}) {
  const [copied, setCopied] = useState(false);
  const resetTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const clearResetTimer = useCallback(() => {
    if (resetTimerRef.current) {
      clearTimeout(resetTimerRef.current);
      resetTimerRef.current = null;
    }
  }, []);

  const copyToClipboard = useCallback(
    async (text: string) => {
      try {
        await navigator.clipboard.writeText(text);
        clearResetTimer();
        setCopied(true);
        resetTimerRef.current = setTimeout(() => {
          setCopied(false);
          resetTimerRef.current = null;
        }, resetAfterMs);
        return true;
      } catch {
        return false;
      }
    },
    [clearResetTimer, resetAfterMs]
  );

  useEffect(() => clearResetTimer, [clearResetTimer]);

  return {
    copied,
    copyToClipboard,
    message: copied ? copiedMessage : idleMessage,
  };
}
