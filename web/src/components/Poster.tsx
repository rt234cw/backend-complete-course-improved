import { useState } from "react";

type PosterProps = {
  url: string | null;
  title: string;
  className?: string;
};

export const Poster = ({ url, title, className = "" }: PosterProps) => {
  const [failedUrl, setFailedUrl] = useState<string | null>(null);

  if (!url || url === failedUrl) {
    return (
      <div
        className={`flex aspect-[2/3] items-center justify-center bg-neutral-800 p-3 text-center text-sm text-neutral-500 ${className}`}
      >
        {title}
      </div>
    );
  }

  return (
    <img
      src={url}
      alt={`Poster for ${title}`}
      loading="lazy"
      onError={() => {
        setFailedUrl(url);
      }}
      className={`aspect-[2/3] w-full bg-neutral-800 object-cover ${className}`}
    />
  );
};
