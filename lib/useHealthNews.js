// lib/useHealthNews.js

import useSWRInfinite from 'swr/infinite'

const fetcher = url => fetch(url).then(res => res.json())

export function useHealthNews(pageSize = 20) {
  // key generator for SWR Infinite
  const getKey = (pageIndex, previousPageData) => {
    // stop if no more pages
    if (previousPageData && !previousPageData.hasMore) return null
    return `/api/health-news?page=${pageIndex}&limit=${pageSize}`
  }

  const {
    data,
    error,
    size,
    setSize,
    isValidating,
  } = useSWRInfinite(getKey, fetcher, {
    revalidateFirstPage: false, // optional
  })

  const news = data ? data.flatMap(page => page.news) : []
  const hasMore = data ? data[data.length - 1].hasMore : true
  const isLoadingInitialData = !data && !error
  const isLoadingMore =
    isLoadingInitialData ||
    (size > 0 && data && typeof data[size - 1] === 'undefined')

  return {
    news,
    error,
    hasMore,
    isLoadingMore,
    isValidating,
    size,
    setSize,
  }
}
