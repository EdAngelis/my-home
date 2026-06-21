import React from "react";

interface AnimatedSVGProps {
  width: number;
  height: number;
}

const AnimatedSVG: React.FC<AnimatedSVGProps> = ({ width, height }) => {
  return (
    <svg width={width} height={height} viewBox="0 0 100 100">
      <rect x="0" y="0" width="100" height="100" fill="#fff" />
      <circle cx="50" cy="50" r="40" fill="#000" />
      <animateTransform
        attributeName="transform"
        attributeType="XML"
        type="rotate"
        from="0 50 50"
        to="360 50 50"
        dur="5s"
        repeatCount="indefinite"
      />
    </svg>
  );
};

export default AnimatedSVG;
