// components/EmptyState.jsx

import Lottie from "lottie-react";
import PropTypes from "prop-types";
import Load from "../public/animations/Loading.json"; // ensure you have this

export default function Loading({
  message = "Select a conversation to start chatting.",
  height = 300,
  width = 300,
}) {
  return (
    <div className="flex flex-col items-center justify-center h-full p-6">
      <div style={{ width, height }}>
        <Lottie
          animationData={Load}
          loop
          autoplay
          style={{ width: "100%", height: "100%" }}
        />
      </div>
      <p className="mt-2 text-sm font-medium text-gray-600 text-center">
        {message}
      </p>
    </div>
  );
}

Loading.propTypes = {
  message: PropTypes.string,
  height: PropTypes.oneOfType([PropTypes.number, PropTypes.string]),
  width: PropTypes.oneOfType([PropTypes.number, PropTypes.string]),
};
