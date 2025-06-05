// pages/profile.jsx
import { getUserFromToken } from "../lib/auth";

/**
 * This page simply redirects an authenticated user from `/profile`
 * to `/users/[their‐username]`. If not signed in, it sends them to /signin.
 */
export default function Profile() {
  // Since redirect is handled server‐side, this component body never actually renders.
  return null;
}

export async function getServerSideProps(context) {
  const user = await getUserFromToken(context.req);
  if (!user) {
    // Not signed in → send to /signin
    return {
      redirect: {
        destination: "/signin",
        permanent: false,
      },
    };
  }

  // Authenticated → redirect to `/users/[username]`
  return {
    redirect: {
      destination: `/users/${encodeURIComponent(user.username)}`,
      permanent: false,
    },
  };
}
