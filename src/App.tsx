import { useEffect, useState } from 'react';
import { Toaster } from 'sonner';
import { BackupsSheet, saveManualBackup } from '@/components/dialogs/BackupsSheet';
import { DialogHost, ExportDialog, ShareDialog, TemplatesDialog } from '@/components/dialogs/SmallDialogs';
import { EditorPanel } from '@/components/editor/EditorPanel';
import { PreviewPanel } from '@/components/layout/PreviewPanel';
import { SendBar } from '@/components/layout/SendBar';
import { TopBar, type DialogName } from '@/components/layout/TopBar';
import { openShareHash } from '@/store/actions';
import { useBackups } from '@/store/backups';
import { useUi } from '@/store/ui';
import { useActiveMessage } from '@/store/workspace';

/** Backups automáticos cada N minutos (si hubo cambios desde el último). */
function useAutoBackup() {
  useEffect(() => {
    const id = setInterval(() => {
      const ui = useUi.getState();
      if (!ui.autoBackupMinutes || Date.now() - ui.lastAutoBackup < ui.autoBackupMinutes * 60_000) return;
      ui.markAutoBackup();
      useBackups.getState().autoIfChanged();
    }, 30_000);
    return () => clearInterval(id);
  }, []);
}

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
  useEffect(() => void openShareHash(), []);
  useAutoBackup();
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
