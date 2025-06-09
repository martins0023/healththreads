// pages/_app.js
import "../styles/globals.css";
import 'leaflet/dist/leaflet.css';
import "leaflet/dist/leaflet.css";
import "leaflet.markercluster/dist/MarkerCluster.css";
import "leaflet.markercluster/dist/MarkerCluster.Default.css";
import Layout from "../components/Layout";
import { useEffect } from "react";
import { processQueue } from "../lib/offlineQueue";

function MyApp({ Component, pageProps }) {
  useEffect(() => {
    const onOnline = () => {
      processQueue();
    };
    window.addEventListener("online", onOnline);
    return () => {
      window.removeEventListener("online", onOnline);
    };
  }, []);
  return (
    <Layout>
      <Component {...pageProps} />
    </Layout>
  );
}

export default MyApp;
