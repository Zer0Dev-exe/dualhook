import { PanelTop, PenLine, RectangleHorizontal } from 'lucide-react';
import { Card, Tag } from '@/components/ui/card';
import { Empty, TextField } from '@/components/ui/fields';
import { LIMITS, make } from '@/lib/factory';
import type { Message } from '@/lib/types';
import { useWorkspace } from '@/store/workspace';
import { ActionRowEditor } from '../shared/ButtonEditor';
import { AddButtons, ItemActions } from '../shared/ListControls';
import { EmbedEditor } from './EmbedEditor';

const L = LIMITS.v1;

/** Editor del modo V1 (clásico): content + embeds + filas de botones. */
export function V1Editor({ message }: { message: Message }) {
  const update = useWorkspace((s) => s.updateActive);
  const d = message.v1;
  const attachList = `att-${message.id}`;
  return (
    <>
      <Card id={`v1-content-${message.id}`} className="border-mode/40" icon={<PenLine />} title="Contenido">
        <TextField
          multiline
          rows={4}
          max={L.content}
          placeholder="Texto del mensaje — markdown de Discord: **negrita**, *cursiva*, __subrayado__, ||spoiler||, # títulos…"
          value={d.content}
          onChange={(v) => update((m) => void (m.v1.content = v))}
        />
      </Card>

      <Card id={`v1-embeds-${message.id}`} className="border-mode/40" icon={<PanelTop />} title="Embeds" tag={<Tag>{d.embeds.length}/{L.embeds}</Tag>}>
        {d.embeds.length ? (
          d.embeds.map((e, i) => <EmbedEditor key={e._id} embeds={d.embeds} index={i} attachList={attachList} onChange={(embeds) => update((m) => void (m.v1.embeds = embeds))} />)
        ) : (
          <Empty>Sin embeds.</Empty>
        )}
        <AddButtons options={[{ label: 'Embed', disabled: d.embeds.length >= L.embeds, onClick: () => update((m) => void m.v1.embeds.push(make.embed())) }]} />
      </Card>

      <Card id={`v1-rows-${message.id}`} className="border-mode/40" icon={<RectangleHorizontal />} title="Botones" tag={<Tag>{d.components.length}/{L.rows} filas</Tag>}>
        <p className="text-xs text-muted">En webhooks normales solo se admiten botones de enlace. Se envía con <code>?with_components=true</code> automáticamente.</p>
        {d.components.map((r, i) => (
          <ActionRowEditor
            key={r._id}
            row={r}
            onChange={(nr) => update((m) => void (m.v1.components[i] = nr))}
            actions={<ItemActions items={d.components} index={i} max={L.rows} onChange={(rows) => update((m) => void (m.v1.components = rows))} />}
          />
        ))}
        <AddButtons options={[{ label: 'Fila de botones', disabled: d.components.length >= L.rows, onClick: () => update((m) => void m.v1.components.push(make.actionRow())) }]} />
      </Card>
    </>
  );
}
