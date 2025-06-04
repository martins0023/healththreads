// lib/useFeed.js
import useSWRInfinite from "swr/infinite";

const fetcher = (url) => fetch(url).then((res) => res.json());

export function useFeed(pageSize = 10) {
  // Generate the key for each page. The “pageIndex” starts at 0.
  const getKey = (pageIndex, previousPageData) => {
    // If previousPageData is empty, we have no more pages.
    if (previousPageData && !previousPageData.hasMore) return null;
    return `/api/feed?page=${pageIndex}&limit=${pageSize}`;
  };

  const {
    data, // array of page responses
    error,
    size, // current page index + 1
    setSize, // function to load more (increment page)
    isValidating,
  } = useSWRInfinite(getKey, fetcher, {
    revalidateOnFocus: false, // you can toggle this
  });

  // Combine all pages’ posts into a single list
  const posts = data ? data.flatMap((page) => page.posts) : [];
  // hasMore is true if the last loaded page had “hasMore = true”
  const hasMore = data ? data[data.length - 1]?.hasMore : true;
  const isLoadingInitialData = !data && !error;
  const isLoadingMore =
    isLoadingInitialData ||
    (size > 0 && data && typeof data[size - 1] === "undefined");

  return {
    posts,
    error,
    size,
    setSize,
    isValidating,
    isLoadingMore,
    hasMore,
  };
}
