import { useActiveMessage } from '@/store/workspace';
import { useMessageFiles } from '@/store/ui';
import { cn } from '@/lib/utils';
import { EditCard, FilesCard, OptionsCard, ProfileCard } from './MessageSettings';
import { ModeSwitch } from './ModeSwitch';
import { TargetCard } from './TargetCard';
import { V1Editor } from './v1/V1Editor';
import { V2Editor } from './v2/V2Editor';

export function EditorPanel() {
  const m = useActiveMessage();
  const files = useMessageFiles(m.id);
  const isV1 = m.mode === 'v1';
  return (
    <div className="flex flex-col gap-3 px-3 pb-8 pt-3.5 sm:px-4 lg:flex-1 lg:overflow-y-auto">
      {/* sugerencias attachment:// para los campos de URL */}
      <datalist id={`att-${m.id}`}>
        {files.map((f) => (
          <option key={f.name} value={`attachment://${f.name}`} />
        ))}
      </datalist>

      <TargetCard />
      <ModeSwitch message={m} />

      <section className="flex flex-col gap-2.5">
        <div className="flex items-center gap-2 px-0.5 pt-1 text-[11px] font-bold uppercase tracking-wider text-muted">
          <span className={cn('size-1.5 rounded-full', isV1 ? 'bg-v1' : 'bg-v2')} />
          {isV1 ? 'Editando borrador V1 · Clásico' : 'Editando borrador V2 · Components'}
        </div>
        {isV1 ? <V1Editor message={m} /> : <V2Editor message={m} />}
      </section>

      <ProfileCard message={m} />
      <FilesCard message={m} />
      <OptionsCard message={m} />
      <EditCard message={m} />
    </div>
  );
}
