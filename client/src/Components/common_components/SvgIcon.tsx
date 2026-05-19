type SvgIconProps = {
  src: string;
  alt: string;
  className?: string;
};

const SvgIcon = ({ src, alt, className = "" }: SvgIconProps) => {
  return (
    <img
      src={src}
      alt={alt}
      className={`
        object-contain
        select-none
        pointer-events-none
        ${className}
      `}
      loading="lazy"
      draggable={false}
    />
  );
};

export default SvgIcon;
