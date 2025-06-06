// pages/posts/index.jsx
import { useEffect } from "react";
import { useRouter } from "next/router";

export default function PostsIndexRedirect() {
  const router = useRouter();
  useEffect(() => {
    router.replace("/");
  }, [router]);
  return null;
}
