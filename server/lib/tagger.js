const TAG_SPLIT_RE = /[,\n，;；\t]+/;
const INLINE_TAG_RE = /#([^\s#，,。！？!?；;:：·/\\]+(?:[^\s#，,。！？!?；;:：·/\\]*[^\s#，,。！？!?；;:：·/\\])?)/g;

const KEYWORD_TAGS = [
	{ test: /考研|考公|备考|复习/, tags: ['备考', '复盘'] },
	{ test: /英语|单词|听力|阅读/, tags: ['英语', '单词'] },
	{ test: /数学|公式|推导|题目/, tags: ['数学', '刷题'] },
	{ test: /代码|前端|后端|接口|开发/, tags: ['编程', '开发'] },
	{ test: /自习|学习|专注|番茄钟/, tags: ['学习', '专注'] },
	{ test: /健身|跑步|拉伸|运动/, tags: ['运动', '自律'] },
	{ test: /阅读|书单|摘抄|笔记/, tags: ['阅读', '笔记'] },
	{ test: /计划|目标|日程|待办/, tags: ['计划', '目标'] },
];

function normalizeTag(tag) {
	const value = String(tag || '').trim().replace(/^#+/, '').replace(/^[/\s#，,。！？!?；;:：·]+|[/\s#，,。！？!?；;:：·]+$/g, '');
	return value.slice(0, 20);
}

function dedupeTags(tags, limit = 8) {
	const seen = new Set();
	const list = [];
	(tags || []).forEach((tag) => {
		const value = normalizeTag(tag);
		if (!value || seen.has(value)) return;
		seen.add(value);
		list.push(value);
	});
	return list.slice(0, limit);
}

function parseTagsInput(input) {
	if (Array.isArray(input)) return dedupeTags(input);
	if (input && typeof input === 'object') return dedupeTags(Object.values(input));

	const text = String(input || '').trim();
	if (!text) return [];
	if (text.startsWith('[')) {
		try {
			const parsed = JSON.parse(text);
			if (Array.isArray(parsed)) return dedupeTags(parsed);
		} catch {}
	}

	return dedupeTags(text.split(TAG_SPLIT_RE).map(normalizeTag));
}

function extractTagsFromText(...texts) {
	const raw = texts.filter(Boolean).map(String).join(' ');
	if (!raw.trim()) return [];

	const tags = [];
	INLINE_TAG_RE.lastIndex = 0;
	let match;
	while ((match = INLINE_TAG_RE.exec(raw))) {
		tags.push(match[1]);
	}

	const plain = raw.toLowerCase();
	KEYWORD_TAGS.forEach(({ test, tags: keywordTags }) => {
		if (test.test(plain)) tags.push(...keywordTags);
	});

	return dedupeTags(tags);
}

function inferNoteTags({ title, content, tags }) {
	const explicit = parseTagsInput(tags);
	if (explicit.length > 0) return explicit;
	return extractTagsFromText(title || '', content || '');
}

module.exports = {
	dedupeTags,
	extractTagsFromText,
	inferNoteTags,
	normalizeTag,
	parseTagsInput,
};
