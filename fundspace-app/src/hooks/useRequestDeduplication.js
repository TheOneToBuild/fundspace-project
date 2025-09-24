import { useRef, useCallback } from 'react';

export function useRequestDeduplication() {
  const pendingRequests = useRef(new Map());

  const deduplicate = useCallback((key, requestFunction) => {
    if (pendingRequests.current.has(key)) {
      return pendingRequests.current.get(key);
    }

    const promise = requestFunction()
      .finally(() => {
        pendingRequests.current.delete(key);
      });

    pendingRequests.current.set(key, promise);
    return promise;
  }, []);

  return deduplicate;
}