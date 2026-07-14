import { useEffect, useState, lazy, Suspense, useCallback } from 'react';
import type { Lang } from '../../../data/site';
import './CodiChat.css';

const CodiModal = lazy(() => import('./CodiModal'));

interface Props {
  lang: Lang;
}

export default function CodiChat({ lang }: Props) {
  const [open, setOpen] = useState(false);
  const [mounted, setMounted] = useState(false);

  const openCodi = useCallback(() => {
    setMounted(true);
    setOpen(true);
    window.dispatchEvent(new CustomEvent('mk:codi-state', { detail: 'open' }));
  }, []);

  const closeCodi = useCallback(() => {
    setOpen(false);
    window.dispatchEvent(new CustomEvent('mk:codi-state', { detail: 'closed' }));
    const orb = document.querySelector<HTMLElement>('[data-codi-orb]');
    orb?.focus();
  }, []);

  useEffect(() => {
    const onOpen = () => openCodi();
    window.addEventListener('mk:codi-open', onOpen);

    const onKey = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === ';') {
        e.preventDefault();
        if (open) {
          closeCodi();
        } else {
          openCodi();
        }
      }
    };
    window.addEventListener('keydown', onKey);

    return () => {
      window.removeEventListener('mk:codi-open', onOpen);
      window.removeEventListener('keydown', onKey);
    };
  }, [open, openCodi, closeCodi]);

  if (!mounted) return null;

  return (
    <Suspense fallback={null}>
      <CodiModal lang={lang} open={open} onClose={closeCodi} />
    </Suspense>
  );
}
