import { Bookmark, Heart, MessageCircle, Eye } from 'lucide-react';

type Props = {
  liked?: boolean;
  favorited?: boolean;
  likeCount?: number;
  commentCount?: number;
  viewCount?: number;
  onLike?: () => void;
  onFavorite?: () => void;
  onComment?: () => void;
  compact?: boolean;
  showViewCount?: boolean;
};

export default function EngagementBar({
  liked = false,
  favorited = false,
  likeCount = 0,
  commentCount = 0,
  viewCount = 0,
  onLike,
  onFavorite,
  onComment,
  compact = false,
  showViewCount = true,
}: Props) {
  const btnClass = compact
    ? 'px-3 py-1.5 text-xs'
    : 'px-4 py-2 text-sm';

  const iconSize = compact ? 14 : 16;

  return (
    <div className="flex flex-wrap items-center justify-between gap-3">
      <div className="flex items-center gap-2">
        {onLike && (
          <button
            type="button"
            onClick={onLike}
            className={`inline-flex items-center gap-1.5 rounded-full transition-all active:scale-95 ${
              liked ? 'bg-rose-50 text-rose-600' : 'bg-slate-50 text-slate-500 hover:bg-slate-100'
            } ${btnClass}`}
          >
            <Heart size={iconSize} fill={liked ? 'currentColor' : 'none'} />
            <span>{likeCount}</span>
          </button>
        )}
        {onFavorite && (
          <button
            type="button"
            onClick={onFavorite}
            className={`inline-flex items-center gap-1.5 rounded-full transition-all active:scale-95 ${
              favorited ? 'bg-amber-50 text-amber-700' : 'bg-slate-50 text-slate-500 hover:bg-slate-100'
            } ${btnClass}`}
          >
            <Bookmark size={iconSize} fill={favorited ? 'currentColor' : 'none'} />
            <span>{favorited ? '已收藏' : '收藏'}</span>
          </button>
        )}
        {onComment && (
          <button
            type="button"
            onClick={onComment}
            className={`inline-flex items-center gap-1.5 rounded-full bg-slate-50 text-slate-500 hover:bg-slate-100 transition-all active:scale-95 ${btnClass}`}
          >
            <MessageCircle size={iconSize} />
            <span>{commentCount}</span>
          </button>
        )}
      </div>
      {showViewCount && (
        <div className="flex items-center gap-4 text-xs text-slate-400">
          <span className="inline-flex items-center gap-1">
            <Eye size={13} />
            {viewCount}
          </span>
          {onComment && <span>{commentCount} 条评论</span>}
        </div>
      )}
    </div>
  );
}
