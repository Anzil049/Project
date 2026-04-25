import React from 'react';

const Skeleton = ({ className = '', variant = 'rect', width, height }) => {
  const baseClasses = "bg-gray-200 animate-pulse transition-colors";
  
  const variants = {
    rect: "rounded-lg",
    circle: "rounded-full",
    text: "rounded h-4 w-full mb-2"
  };

  const styles = {
    width: width ? (typeof width === 'number' ? `${width}px` : width) : '100%',
    height: height ? (typeof height === 'number' ? `${height}px` : height) : undefined
  };

  return (
    <div 
      className={`${baseClasses} ${variants[variant]} ${className}`}
      style={styles}
    />
  );
};

export default Skeleton;
