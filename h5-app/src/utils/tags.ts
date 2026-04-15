const TAG_SPLIT_RE = /[,\n，;；\s]+/;
const INLINE_TAG_RE = /#([^\s#，,。！？!?；;:：·/\\]+)/g;

const KEYWORD_TAGS: Array<{ test: RegExp; tags: string[] }> = [
  { test: /考研|备考|复习/, tags: ['备考', '复盘'] },
  { test: /英语|单词|阅读|听力/, tags: ['英语', '单词'] },
  { test: /数学|刷题|公式|题目/, tags: ['数学', '刷题'] },
  { test: /代码|前端|后端|接口|开发/, tags: ['编程', '开发'] },
  { test: /学习|自习|专注|番茄/, tags: ['学习', '专注'] },
  { test: /健身|运动|跑步|拉伸/, tags: ['运动', '自律'] },
  { test: /阅读|摘抄|书单|笔记/, tags: ['阅读', '笔记'] },
  { test: /计划|目标|待办|日程/, tags: ['计划', '目标'] },
];

export function normalizeTag(tag: string) {
  return String(tag || '')
    .trim()
    .replace(/^#+/, '')
    .replace(/^[\s#，,。！？!?；;:：·/\\]+|[\s#，,。！？!?；;:：·/\\]+$/g, '')
    .slice(0, 20);
}

export function dedupeTags(tags: string[], limit = 8) {
  const seen = new Set<string>();
  const list: string[] = [];
  tags.forEach((tag) => {
    const value = normalizeTag(tag);
    if (!value || seen.has(value)) return;
    seen.add(value);
    list.push(value);
  });
  return list.slice(0, limit);
}

export function parseTagInput(input: unknown) {
  if (Array.isArray(input)) return dedupeTags(input as string[]);
  if (input && typeof input === 'object') return dedupeTags(Object.values(input as Record<string, string>));

  const text = String(input || '').trim();
  if (!text) return [];
  if (text.startsWith('[')) {
    try {
      const parsed = JSON.parse(text);
      if (Array.isArray(parsed)) return dedupeTags(parsed);
    } catch {}
  }

  return dedupeTags(text.split(TAG_SPLIT_RE));
}

export function extractTagsFromText(...parts: Array<string | null | undefined>) {
  const raw = parts.filter(Boolean).map(String).join(' ');
  if (!raw.trim()) return [];

  INLINE_TAG_RE.lastIndex = 0;
  const tags: string[] = [];
  let match: RegExpExecArray | null;
  while ((match = INLINE_TAG_RE.exec(raw))) {
    tags.push(match[1]);
  }

  const plain = raw.toLowerCase();
  KEYWORD_TAGS.forEach(({ test, tags: keywordTags }) => {
    if (test.test(plain)) tags.push(...keywordTags);
  });

  return dedupeTags(tags);
}

export function suggestTags(title?: string, content?: string, currentTags: string[] = []) {
  return dedupeTags([...currentTags, ...extractTagsFromText(title || '', content || '')]);
}
