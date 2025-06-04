// components/animations.js
import { motion } from 'framer-motion';

export const fadeIn = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { duration: 0.6 } },
};

export const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1, // Delay between each child animation
    },
  },
};

export const textVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.5 } },
};

export const slideInFromLeft = {
  hidden: { x: -100, opacity: 0 },
  visible: { x: 0, opacity: 1, transition: { duration: 0.6 } },
};

export const slideInFromRight = {
  hidden: { x: 100, opacity: 0 },
  visible: { x: 0, opacity: 1, transition: { duration: 0.6 } },
};

export const slideInFromTop = {
  hidden: { y: -100, opacity: 0 },
  visible: { y: 0, opacity: 1, transition: { duration: 0.6 } },
};

export const slideInFromBottom = {
  hidden: { y: 100, opacity: 0 },
  visible: { y: 0, opacity: 1, transition: { duration: 0.6 } },
};

export const zoomIn = {
  hidden: { scale: 0.8, opacity: 0 },
  visible: { scale: 1, opacity: 1, transition: { duration: 0.6 } },
};

export const zoomOut = {
  hidden: { scale: 1.2, opacity: 0 },
  visible: { scale: 1, opacity: 1, transition: { duration: 0.6 } },
};

export const rotateIn = {
  hidden: { rotate: -180, opacity: 0 },
  visible: { rotate: 0, opacity: 1, transition: { duration: 0.6 } },
};

export const rotateOut = {
  hidden: { rotate: 0, opacity: 1 },
  visible: { rotate: 180, opacity: 0, transition: { duration: 0.6 } },
};

export const bounce = {
  hidden: { y: 0 },
  visible: {
    y: [0, -10, 0],
    transition: { duration: 0.6, repeat: Infinity, repeatDelay: 0.3 },
  },
};

export const bouncex = {
  hidden: { x: 0 },
  visible: {
    x: [0, -10, 0],
    transition: { duration: 0.6, repeat: Infinity, repeatDelay: 0.3 },
  },
};

export const pulse = {
  hidden: { scale: 1 },
  visible: {
    scale: [1, 1.05, 1],
    transition: { duration: 0.6, repeat: Infinity, repeatDelay: 0.3 },
  },
};

export const staggerContainer = {
  hidden: {},
  visible: {
    transition: {
      staggerChildren: 0.2,
    },
  },
};

export const animateOnHover = {
  whileHover: { scale: 1.05, transition: { duration: 0.3 } },
};

export const animateOnClick = {
  whileTap: { scale: 0.95, transition: { duration: 0.2 } },
};

export const continuousTextAnimation = {
  hidden: { opacity: 0, y: 20 },
  visible: {
    opacity: 1,
    y: 0,
    transition: {
      duration: 2,
      ease: "easeInOut",
      repeat: Infinity,
      repeatType: "reverse",
    },
  },
};

export const marqueeText = {
  animate: {
    x: ["100%", "-100%"],
    transition: {
      x: {
        repeat: Infinity,
        repeatType: "loop",
        duration: 10,
        ease: "linear",
      },
    },
  },
};

