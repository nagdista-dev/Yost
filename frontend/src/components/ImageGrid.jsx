import LazyImage from './LazyImage';

export default function ImageGrid({ images, onOpen }) {
  const count = images.length;
  const visible = images.slice(0, 4);
  const extra = count - 4;

  if (count === 1) {
    return (
      <div
        className="rounded-xl overflow-hidden cursor-pointer border border-yt-border bg-yt-bg-tertiary mt-3"
        onClick={() => onOpen(0)}
      >
        <LazyImage
          src={images[0]}
          alt="Post image"
          imgClassName="w-full max-h-[420px] object-cover hover:opacity-95 transition-opacity duration-200"
        />
      </div>
    );
  }

  if (count === 2) {
    return (
      <div className="grid grid-cols-2 gap-1.5 rounded-xl overflow-hidden mt-3">
        {images.map((img, i) => (
          <LazyImage
            key={i}
            src={img}
            alt={`Image ${i + 1}`}
            wrapperClassName="aspect-square cursor-pointer border border-yt-border rounded-xl"
            imgClassName="w-full h-full object-cover hover:scale-[1.02] transition-transform duration-200"
            onClick={() => onOpen(i)}
          />
        ))}
      </div>
    );
  }

  if (count === 3) {
    return (
      <div className="grid grid-cols-2 gap-1.5 rounded-xl overflow-hidden mt-3">
        <LazyImage
          src={images[0]}
          alt="Image 1"
          wrapperClassName="row-span-2 aspect-[3/4] md:aspect-square cursor-pointer border border-yt-border rounded-xl"
          imgClassName="w-full h-full object-cover hover:scale-[1.02] transition-transform duration-200"
          onClick={() => onOpen(0)}
        />
        <div className="flex flex-col gap-1.5">
          {images.slice(1).map((img, i) => (
            <LazyImage
              key={i}
              src={img}
              alt={`Image ${i + 2}`}
              wrapperClassName="flex-1 aspect-square cursor-pointer border border-yt-border rounded-xl"
              imgClassName="w-full h-full object-cover hover:scale-[1.02] transition-transform duration-200"
              onClick={() => onOpen(i + 1)}
            />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-2 gap-1.5 mt-3">
      {visible.map((img, i) => (
        <div
          key={i}
          className="relative aspect-square overflow-hidden cursor-pointer border border-yt-border rounded-xl"
          onClick={() => onOpen(i)}
        >
          <LazyImage
            src={img}
            alt={`Image ${i + 1}`}
            imgClassName="w-full h-full object-cover hover:scale-[1.02] transition-transform duration-200"
          />
          {i === 3 && extra > 0 && (
            <div className="absolute inset-0 bg-black/55 flex items-center justify-center text-white font-bold text-2xl pointer-events-none">
              +{extra}
            </div>
          )}
        </div>
      ))}
    </div>
  );
}
