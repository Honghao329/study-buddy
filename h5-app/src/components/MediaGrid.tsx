import { X } from 'lucide-react';
import { resolveMediaUrl } from '../utils/media';

type Props = {
  images?: string[];
  className?: string;
  onRemove?: (index: number) => void;
  cover?: boolean;
};

export default function MediaGrid({ images = [], className = '', onRemove, cover = false }: Props) {
  if (!images.length) return null;

  const gridClass = cover
    ? 'grid grid-cols-1 gap-3'
    : images.length === 1
      ? 'grid grid-cols-1'
      : images.length === 2
        ? 'grid grid-cols-2 gap-2'
        : 'grid grid-cols-3 gap-2';

  return (
    <div className={`${gridClass} ${className}`}>
      {images.map((image, index) => {
        const isLarge = cover && index === 0;
        return (
          <div key={`${image}-${index}`} className="relative overflow-hidden rounded-2xl bg-slate-100">
            <img
              src={resolveMediaUrl(image)}
              alt=""
              className={`w-full object-cover ${isLarge ? 'h-56' : 'aspect-square'}`}
            />
            {onRemove && (
              <button
                type="button"
                className="absolute right-2 top-2 flex h-7 w-7 items-center justify-center rounded-full bg-black/55 text-white backdrop-blur-sm"
                onClick={() => onRemove(index)}
              >
                <X size={14} />
              </button>
            )}
          </div>
        );
      })}
    </div>
  );
}
