import React from "react";
import styles from "./styles.module.css";

type ImageSize = "sm" | "lg" | "xl" | "xxl" | "huge";

interface ImageWrapperProps {
  imgUrl: string;
  caption?: string;
  onClick?: () => void;
  size?: ImageSize; // optional; no default
}

const sizeClassMap: Record<ImageSize, string> = {
  sm: styles.imageSm,
  lg: styles.imageLg,
  xl: styles.imageXl,
  xxl: styles.imageXxl,
  huge: styles.imageHuge,
};

const ImageWrapper = ({
  imgUrl,
  caption,
  onClick,
  size,
}: ImageWrapperProps) => {
  const sizeClass = size ? sizeClassMap[size] : "";

  return (
    <figure
      className={styles.imageCaptionWrapper}
      onClick={onClick}
      style={{ cursor: onClick ? "pointer" : "default" }}
    >
      <img
        src={imgUrl}
        className={`${styles.image} ${sizeClass}`}
        alt={caption ?? "image"}
      />
      {caption && <figcaption>{caption}</figcaption>}
    </figure>
  );
};

export default ImageWrapper;
