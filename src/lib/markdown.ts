import { discordTime, escapeHtml } from './utils';

/**
 * Markdown estilo Discord → HTML (aproximado, para la vista previa).
 * El texto se escapa antes de procesarlo, así que el HTML resultante es seguro.
 */
export function renderMarkdown(src: string): string {
  if (!src) return '';
  const store: string[] = [];
  const keep = (html: string) => `\u0001${store.push(html) - 1}\u0002`;
  const link = (href: string, inner: string) =>
    `<a class="md-link" href="${href}" target="_blank" rel="noopener noreferrer">${inner}</a>`;

  let text = escapeHtml(src.replace(/[\u0001\u0002]/g, ''));

  // Código (su contenido no se formatea)
  text = text.replace(/```(?:([\w+#-]{1,20})\n)?([\s\S]*?)```/g, (_, _lang, code: string) =>
    keep(`<pre class="md-pre"><code>${code.replace(/^\n/, '').replace(/\n$/, '')}</code></pre>`),
  );
  text = text.replace(/``([^`]+?)``|`([^`\n]+?)`/g, (_, a, b) => keep(`<code class="md-code">${a || b}</code>`));

  // Enlaces
  text = text.replace(/\[([^\]\n]+)\]\((?:&lt;)?(https?:\/\/[^\s)]+?)(?:&gt;)?\)/g, (_, t, u) => keep(link(u, inline(t))));
  text = text.replace(/&lt;(https?:\/\/[^\s]+?)&gt;/g, (_, u) => keep(link(u, u)));
  text = text.replace(/https?:\/\/[^\s<\u0001]+[^\s<\u0001.,:;!?'")\]]/g, (u) => keep(link(u, u)));

  // Menciones, emojis y marcas de tiempo
  text = text.replace(/&lt;@!?(\d{15,21})&gt;/g, () => keep('<span class="mention">@usuario</span>'));
  text = text.replace(/&lt;@&amp;(\d{15,21})&gt;/g, () => keep('<span class="mention">@rol</span>'));
  text = text.replace(/&lt;#(\d{15,21})&gt;/g, () => keep('<span class="mention">#canal</span>'));
  text = text.replace(/&lt;id:(customize|browse|guide)&gt;/g, (_, n) => keep(`<span class="mention">#${n}</span>`));
  text = text.replace(/&lt;\/([\w -]{1,32}):(\d{15,21})&gt;/g, (_, n) => keep(`<span class="mention">/${n}</span>`));
  text = text.replace(/@(everyone|here)\b/g, (_, n) => keep(`<span class="mention">@${n}</span>`));
  text = text.replace(/&lt;(a?):(\w{2,32}):(\d{15,21})&gt;/g, (_, a, n, id) =>
    keep(`<img class="emoji" alt=":${n}:" title=":${n}:" src="https://cdn.discordapp.com/emojis/${id}.${a ? 'gif' : 'webp'}?size=48">`),
  );
  text = text.replace(/&lt;t:(-?\d{1,13})(?::([tTdDfFR]))?&gt;/g, (_, ts, st) =>
    keep(`<span class="md-time">${discordTime(+ts, st || 'f')}</span>`),
  );

  let html = blocks(text.split('\n'));
  for (let guard = 0; /\u0001\d+\u0002/.test(html) && guard < 10; guard++) {
    html = html.replace(/\u0001(\d+)\u0002/g, (_, n) => store[+n]);
  }
  return html;

  function inline(s: string) {
    return s
      .replace(/\*\*\*([^*]+?)\*\*\*/g, '<strong><em>$1</em></strong>')
      .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
      .replace(/__(.+?)__/g, '<u>$1</u>')
      .replace(/(^|[^*\w])\*(?![\s*])(.+?)\*(?!\*)/g, '$1<em>$2</em>')
      .replace(/(^|[^\w])_(?!_)(.+?)_(?!\w)/g, '$1<em>$2</em>')
      .replace(/~~(.+?)~~/g, '<s>$1</s>')
      .replace(/\|\|(.+?)\|\|/g, '<span class="md-spoiler">$1</span>');
  }

  function blocks(lines: string[]): string {
    const segs: { block: boolean; html: string }[] = [];
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      let m: RegExpMatchArray | null;
      if ((m = line.match(/^&gt;&gt;&gt; ?(.*)$/))) {
        segs.push({ block: true, html: `<blockquote>${blocks([m[1], ...lines.slice(i + 1)])}</blockquote>` });
        break;
      }
      if (/^&gt;( |$)/.test(line)) {
        const q: string[] = [];
        while (i < lines.length && /^&gt;( |$)/.test(lines[i])) q.push(lines[i++].replace(/^&gt; ?/, ''));
        i--;
        segs.push({ block: true, html: `<blockquote>${blocks(q)}</blockquote>` });
        continue;
      }
      if ((m = line.match(/^(#{1,3}) +(.+)$/))) {
        const n = m[1].length;
        segs.push({ block: true, html: `<h${n} class="md-h">${inline(m[2])}</h${n}>` });
        continue;
      }
      if ((m = line.match(/^-# +(.+)$/))) {
        segs.push({ block: true, html: `<div class="md-sub">${inline(m[1])}</div>` });
        continue;
      }
      if (/^ *[-*] +\S/.test(line)) {
        const items: string[] = [];
        while (i < lines.length && (m = lines[i].match(/^( *)[-*] +(.*)$/))) {
          items.push(`<li style="margin-left:${Math.min(m[1].length >> 1, 3) * 1.2}em">${inline(m[2])}</li>`);
          i++;
        }
        i--;
        segs.push({ block: true, html: `<ul class="md-ul">${items.join('')}</ul>` });
        continue;
      }
      if ((m = line.match(/^ *(\d{1,9})\. +\S/))) {
        const start = +m[1];
        const items: string[] = [];
        while (i < lines.length && (m = lines[i].match(/^ *\d{1,9}\. +(.*)$/))) {
          items.push(`<li>${inline(m[1])}</li>`);
          i++;
        }
        i--;
        segs.push({ block: true, html: `<ol class="md-ol" start="${start}">${items.join('')}</ol>` });
        continue;
      }
      if ((m = line.match(/^\u0001(\d+)\u0002$/)) && store[+m[1]].startsWith('<pre')) {
        segs.push({ block: true, html: line });
        continue;
      }
      segs.push({ block: false, html: inline(line) });
    }
    return segs.map((s, k) => (!s.block && k > 0 && !segs[k - 1].block ? '<br>' : '') + s.html).join('');
  }
}
