"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { Icon } from "./Icon";

type Toast = { id: number; message: string };
type ToastApi = (message: string) => void;

const ToastContext = createContext<ToastApi>(() => {});

export function useToast() {
  return useContext(ToastContext);
}

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);
  const seq = useRef(0);

  const push = useCallback<ToastApi>((message) => {
    const id = ++seq.current;
    setToasts((t) => [...t.slice(-2), { id, message }]);
    window.setTimeout(
      () => setToasts((t) => t.filter((x) => x.id !== id)),
      3600,
    );
  }, []);

  // a single DOM event lets non-React-free code paths (store, map) fire toasts
  useEffect(() => {
    const handler = (e: Event) => push((e as CustomEvent<string>).detail);
    window.addEventListener('sa-toast', handler as EventListener);
    return () => window.removeEventListener('sa-toast', handler as EventListener);
  }, [push]);

  const value = useMemo(() => push, [push]);

  return (
    <ToastContext.Provider value={value}>
      {children}
      <div className="ui-toasts" role="status" aria-live="polite">
        {toasts.map((t) => (
          <div key={t.id} className="ui-toast">
            <Icon name="info" size={16} />
            <span>{t.message}</span>
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
}
