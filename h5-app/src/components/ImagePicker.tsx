import { useRef, useState } from 'react';
import { Image as ImageIcon, Loader2, Plus } from 'lucide-react';
import { api } from '../api/request';
import { resolveMediaUrl } from '../utils/media';
import MediaGrid from './MediaGrid';

type Props = {
  images: string[];
  onChange: (images: string[]) => void;
  maxCount?: number;
  hint?: string;
};

export default function ImagePicker({ images, onChange, maxCount = 9, hint = '最多上传 9 张图片' }: Props) {
  const inputRef = useRef<HTMLInputElement | null>(null);
  const [uploading, setUploading] = useState(false);

  const uploadFiles = async (fileList: FileList | null) => {
    if (!fileList || fileList.length === 0) return;
    setUploading(true);
    try {
      const nextImages = [...images];
      for (const file of Array.from(fileList).slice(0, maxCount - nextImages.length)) {
        const formData = new FormData();
        formData.append('file', file);
        const res: any = await api.post('/upload/image', formData);
        const url = res?.url || res?.path;
        if (url) nextImages.push(url);
      }
      onChange(nextImages.slice(0, maxCount));
    } finally {
      setUploading(false);
      if (inputRef.current) inputRef.current.value = '';
    }
  };

  const removeImage = (index: number) => {
    onChange(images.filter((_, i) => i !== index));
  };

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm font-semibold text-slate-800">图片</p>
          <p className="text-xs text-slate-400">{hint}</p>
        </div>
        <button
          type="button"
          className="inline-flex items-center gap-1 rounded-full bg-indigo-50 px-3 py-1.5 text-xs font-medium text-indigo-600"
          onClick={() => inputRef.current?.click()}
          disabled={uploading || images.length >= maxCount}
        >
          {uploading ? <Loader2 size={13} className="animate-spin" /> : <Plus size={13} />}
          <span>{uploading ? '上传中' : '添加图片'}</span>
        </button>
      </div>

      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        multiple
        className="hidden"
        onChange={(e) => uploadFiles(e.target.files)}
      />

      {images.length > 0 ? (
        <MediaGrid
          images={images.map((image) => resolveMediaUrl(image))}
          onRemove={removeImage}
          className="mt-2"
        />
      ) : (
        <button
          type="button"
          onClick={() => inputRef.current?.click()}
          className="flex w-full flex-col items-center justify-center rounded-2xl border border-dashed border-slate-200 bg-slate-50/80 px-4 py-8 text-slate-400"
        >
          <ImageIcon size={24} />
          <span className="mt-2 text-sm">点击添加图片</span>
        </button>
      )}
    </div>
  );
}
