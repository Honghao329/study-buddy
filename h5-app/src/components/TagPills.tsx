type Props = {
  tags?: string[];
  className?: string;
  compact?: boolean;
};

export default function TagPills({ tags = [], className = '', compact = false }: Props) {
  if (!tags.length) return null;

  return (
    <div className={`flex flex-wrap gap-2 ${className}`}>
      {tags.map((tag) => (
        <span
          key={tag}
          className={`inline-flex items-center rounded-full border border-indigo-100 bg-indigo-50/80 text-indigo-700 ${
            compact ? 'px-2 py-0.5 text-[10px]' : 'px-2.5 py-1 text-[11px]'
          } font-medium`}
        >
          #{tag}
        </span>
      ))}
    </div>
  );
}
