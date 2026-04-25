import { useEffect, useRef, useState } from 'react';

const useInfiniteScroll = (callback, options = {}) => {
  const [isFetching, setIsFetching] = useState(false);
  const observer = useRef();

  const lastElementRef = (node) => {
    if (isFetching) return;
    if (observer.current) observer.current.disconnect();

    observer.current = new IntersectionObserver((entries) => {
      if (entries[0].isIntersecting) {
        setIsFetching(true);
      }
    }, options);

    if (node) observer.current.observe(node);
  };

  useEffect(() => {
    if (!isFetching) return;
    
    const loadMore = async () => {
      await callback();
      setIsFetching(false);
    };

    loadMore();
  }, [isFetching]);

  return [isFetching, lastElementRef];
};

export default useInfiniteScroll;
