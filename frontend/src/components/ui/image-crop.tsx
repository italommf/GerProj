'use client';

import * as React from 'react';
import ReactCrop, {
  type PercentCrop,
  type PixelCrop,
  centerCrop,
  makeAspectCrop,
} from 'react-image-crop';
import 'react-image-crop/dist/ReactCrop.css';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

function cropImage(
  image: HTMLImageElement,
  crop: PixelCrop
): Promise<string> {
  const canvas = document.createElement('canvas');
  const ctx = canvas.getContext('2d');
  if (!ctx) return Promise.reject(new Error('No 2d context'));

  const scaleX = image.naturalWidth / image.width;
  const scaleY = image.naturalHeight / image.height;

  const cropX = crop.x * scaleX;
  const cropY = crop.y * scaleY;
  const cropW = crop.width * scaleX;
  const cropH = crop.height * scaleY;

  canvas.width = cropW;
  canvas.height = cropH;
  ctx.drawImage(image, cropX, cropY, cropW, cropH, 0, 0, cropW, cropH);

  return new Promise((resolve, reject) => {
    canvas.toBlob(
      (blob) => {
        if (!blob) {
          reject(new Error('Canvas toBlob failed'));
          return;
        }
        const reader = new FileReader();
        reader.onloadend = () => resolve(reader.result as string);
        reader.onerror = reject;
        reader.readAsDataURL(blob);
      },
      'image/png',
      0.95
    );
  });
}

export interface ImageCropProps {
  src: string;
  onCropComplete?: (dataUrl: string) => void;
  aspect?: number;
  circularCrop?: boolean;
  className?: string;
  maxSize?: number;
}

export function ImageCrop({
  src,
  onCropComplete,
  aspect = 1,
  circularCrop = true,
  className,
  maxSize = 512,
}: ImageCropProps) {
  const imgRef = React.useRef<HTMLImageElement>(null);
  const [crop, setCrop] = React.useState<PercentCrop>();
  const [completedCrop, setCompletedCrop] = React.useState<PixelCrop>();
  const [loading, setLoading] = React.useState(false);

  const onImageLoad = (e: React.SyntheticEvent<HTMLImageElement>) => {
    const { naturalWidth: width, naturalHeight: height } = e.currentTarget;
    const initialCrop = centerCrop(
      makeAspectCrop(
        { unit: '%', width: 90 },
        aspect,
        width,
        height
      ),
      width,
      height
    );
    setCrop(initialCrop);
    setCompletedCrop({
      unit: 'px',
      x: (initialCrop.x / 100) * width,
      y: (initialCrop.y / 100) * height,
      width: (initialCrop.width / 100) * width,
      height: (initialCrop.height / 100) * height,
    });
  };

  const handleCropChange = (_pixelCrop: PixelCrop, percentCrop: PercentCrop) => {
    setCrop(percentCrop);
  };

  const handleComplete = (c: PixelCrop) => {
    setCompletedCrop(c);
  };

  const handleApply = async () => {
    if (!completedCrop || !imgRef.current) return;
    setLoading(true);
    try {
      let dataUrl = await cropImage(imgRef.current, completedCrop);
      if (maxSize) {
        dataUrl = await resizeImageToMaxSize(dataUrl, maxSize);
      }
      onCropComplete?.(dataUrl);
    } catch (err) {
      console.error('Crop failed:', err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={cn('space-y-4', className)}>
      <div className="relative max-h-[320px] overflow-hidden rounded-lg bg-[var(--color-muted)] [&_.ReactCrop__crop-selection]:rounded-full">
        <ReactCrop
          crop={crop}
          onChange={handleCropChange}
          onComplete={handleComplete}
          aspect={aspect}
          circularCrop={circularCrop}
          className="max-h-[320px]"
        >
          <img
            ref={imgRef}
            src={src}
            alt="Crop"
            onLoad={onImageLoad}
            className="max-h-[320px] w-auto object-contain"
            style={{ maxHeight: 320 }}
          />
        </ReactCrop>
      </div>
      <div className="flex gap-2">
        <Button
          type="button"
          onClick={handleApply}
          disabled={!completedCrop || loading}
        >
          {loading ? 'Aplicando...' : 'Aplicar recorte'}
        </Button>
      </div>
    </div>
  );
}

function resizeImageToMaxSize(dataUrl: string, maxSize: number): Promise<string> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => {
      let { width, height } = img;
      if (width <= maxSize && height <= maxSize) {
        resolve(dataUrl);
        return;
      }
      const ratio = Math.min(maxSize / width, maxSize / height);
      width = Math.round(width * ratio);
      height = Math.round(height * ratio);
      const canvas = document.createElement('canvas');
      canvas.width = width;
      canvas.height = height;
      const ctx = canvas.getContext('2d');
      if (!ctx) {
        resolve(dataUrl);
        return;
      }
      ctx.drawImage(img, 0, 0, width, height);
      canvas.toBlob(
        (blob) => {
          if (!blob) {
            resolve(dataUrl);
            return;
          }
          const reader = new FileReader();
          reader.onloadend = () => resolve(reader.result as string);
          reader.onerror = reject;
          reader.readAsDataURL(blob);
        },
        'image/png',
        0.9
      );
    };
    img.onerror = () => reject(new Error('Failed to load image'));
    img.src = dataUrl;
  });
}
