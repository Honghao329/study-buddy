import { useMemo, useState } from 'react';
import { Hash, Sparkles, X } from 'lucide-react';
import { extractTagsFromText, normalizeTag, parseTagInput, suggestTags } from '../utils/tags';
import TagPills from './TagPills';

type Props = {
  tags: string[];
  onChange: (tags: string[]) => void;
  title?: string;
  content?: string;
  placeholder?: string;
  maxCount?: number;
};

export default function TagEditor({
  tags,
  onChange,
  title,
  content,
  placeholder = '输入标签，回车或逗号确认',
  maxCount = 8,
}: Props) {
  const [draft, setDraft] = useState('');

  const smartTags = useMemo(() => {
    const candidates = suggestTags(title, content, tags);
    return candidates.filter((tag) => !tags.includes(tag)).slice(0, 6);
  }, [title, content, tags]);

  const addTag = (raw: string) => {
    const value = normalizeTag(raw);
    if (!value) return;
    if (tags.includes(value) || tags.length >= maxCount) return;
    onChange([...tags, value]);
  };

  const commitDraft = () => {
    const values = parseTagInput(draft);
    if (values.length === 0) return;
    const next = [...tags];
    values.forEach((tag) => {
      const value = normalizeTag(tag);
      if (!value || next.includes(value) || next.length >= maxCount) return;
      next.push(value);
    });
    onChange(next);
    setDraft('');
  };

  const quickAddFromText = () => {
    const extracted = extractTagsFromText(title || '', content || '');
    const next = [...tags];
    extracted.forEach((tag) => {
      if (!next.includes(tag) && next.length < maxCount) next.push(tag);
    });
    onChange(next);
  };

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm font-semibold text-slate-800">标签</p>
          <p className="text-xs text-slate-400">支持 `#123`、中文和手动输入</p>
        </div>
        <button
          type="button"
          onClick={quickAddFromText}
          className="inline-flex items-center gap-1 rounded-full bg-amber-50 px-3 py-1.5 text-xs font-medium text-amber-700"
        >
          <Sparkles size={13} />
          <span>智能识别</span>
        </button>
      </div>

      <div className="rounded-2xl border border-slate-200 bg-white px-3 py-3 shadow-sm">
        <div className="flex flex-wrap gap-2">
          {tags.length === 0 ? (
            <span className="text-xs text-slate-400">还没有标签</span>
          ) : (
            tags.map((tag) => (
              <button
                key={tag}
                type="button"
                onClick={() => onChange(tags.filter((item) => item !== tag))}
                className="inline-flex items-center gap-1 rounded-full bg-indigo-50 px-3 py-1.5 text-xs font-medium text-indigo-700"
              >
                <Hash size={11} />
                <span>{tag}</span>
                <X size={11} />
              </button>
            ))
          )}
        </div>

        <div className="mt-3 flex items-center gap-2 rounded-2xl bg-slate-50 px-3 py-2.5">
          <Hash size={14} className="text-slate-400" />
          <input
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            onBlur={commitDraft}
            onKeyDown={(e) => {
              if (['Enter', ',', 'Tab'].includes(e.key)) {
                e.preventDefault();
                commitDraft();
              }
              if (e.key === 'Backspace' && !draft && tags.length) {
                onChange(tags.slice(0, -1));
              }
            }}
            placeholder={placeholder}
            className="w-full bg-transparent text-sm text-slate-700 outline-none placeholder:text-slate-300"
          />
        </div>
      </div>

      {smartTags.length > 0 && (
        <div className="space-y-2">
          <p className="text-xs font-medium text-slate-400">推荐标签</p>
          <TagPills tags={smartTags} className="gap-1.5" compact />
          <div className="flex flex-wrap gap-2">
            {smartTags.map((tag) => (
              <button
                key={tag}
                type="button"
                onClick={() => addTag(tag)}
                className="rounded-full border border-slate-200 bg-white px-3 py-1.5 text-xs text-slate-600 shadow-sm"
              >
                + {tag}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
