"use client";

import Image, { ImageLoader, ImageLoaderProps, ImageProps } from "next/image";

const contentfulLoader: ImageLoader = ({
  src,
  width,
  quality,
}: ImageLoaderProps) => {
  return `${src}?w=${width}&q=${quality || 75}`;
};

export function ContentfulImage({
  src,
  alt,
  width,
  height,
  ...props
}: ImageProps) {
  return (
    <Image
      loader={contentfulLoader}
      src={src || "/placeholder.svg"}
      alt={alt}
      width={width}
      height={height}
      {...props}
    />
  );
}
