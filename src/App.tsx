import { useEffect, useState } from 'react';
import { Toaster } from 'sonner';
import { BackupsSheet, saveManualBackup } from '@/components/dialogs/BackupsSheet';
import { DialogHost, ExportDialog, ShareDialog, TemplatesDialog } from '@/components/dialogs/SmallDialogs';
import { EditorPanel } from '@/components/editor/EditorPanel';
import { PreviewPanel } from '@/components/layout/PreviewPanel';
import { SendBar } from '@/components/layout/SendBar';
import { TopBar, type DialogName } from '@/components/layout/TopBar';
import { startUrlSync } from '@/store/actions';
import { useActiveMessage } from '@/store/workspace';

function useShortcuts() {
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (!(e.ctrlKey || e.metaKey)) return;
      if (e.key === 's') {
        e.preventDefault();
        saveManualBackup();
      } else if (e.key === 'Enter') {
        e.preventDefault();
        document.getElementById('send-button')?.click();
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, []);
}

export default function App() {
  const mode = useActiveMessage().mode;
  const [dialog, setDialog] = useState<DialogName | null>(null);
  const [exportWithBackups, setExportWithBackups] = useState(false);

  // El color de acento de toda la interfaz sigue al modo del mensaje activo
  useEffect(() => {
    document.documentElement.dataset.mode = mode;
  }, [mode]);
  // El enlace de la página guarda el contenido: si se sale sin guardar backup, no se pierde
  useEffect(() => {
    let unsubscribe: (() => void) | undefined;
    let cancelled = false;
    startUrlSync().then((u) => (cancelled ? u() : (unsubscribe = u)));
    return () => {
      cancelled = true;
      unsubscribe?.();
    };
  }, []);
  useShortcuts();

  const openDialog = (d: DialogName | null) => {
    if (d === 'export') setExportWithBackups(dialog === 'backups');
    setDialog(d);
  };
  const toggle = (d: DialogName) => (open: boolean) => setDialog(open ? d : null);

  return (
    <div className="flex h-full flex-col">
      <TopBar onOpen={openDialog} />
      <main className="grid min-h-0 flex-1 grid-cols-1 overflow-y-auto lg:grid-cols-2 lg:overflow-hidden">
        <section className="flex flex-col border-line lg:min-h-0 lg:border-r">
          <EditorPanel />
          <SendBar />
        </section>
        <PreviewPanel />
      </main>

      <BackupsSheet open={dialog === 'backups'} onOpenChange={toggle('backups')} onExport={() => openDialog('export')} />
      <ExportDialog open={dialog === 'export'} onOpenChange={toggle('export')} includeBackups={exportWithBackups} />
      <ShareDialog open={dialog === 'share'} onOpenChange={toggle('share')} />
      <TemplatesDialog open={dialog === 'templates'} onOpenChange={toggle('templates')} />
      <DialogHost />
      <Toaster theme="dark" position="bottom-right" richColors closeButton toastOptions={{ style: { whiteSpace: 'pre-line' } }} />
    </div>
  );
}
