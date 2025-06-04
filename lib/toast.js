// lib/toast.js

/**
 * Simple toast utility.
 * Usage: showToast("Your message here", "success" or "error" or "info").
 * It creates a div, animates it in, then removes it.
 */

export function showToast(message, variant = "success") {
    // 1. Create container if it doesn't exist
    let container = document.getElementById("toast-container");
    if (!container) {
      container = document.createElement("div");
      container.id = "toast-container";
      container.style.position = "fixed";
      container.style.bottom = "1rem";
      container.style.left = "50%";
      container.style.transform = "translateX(-50%)";
      container.style.display = "flex";
      container.style.flexDirection = "column";
      container.style.alignItems = "center";
      container.style.zIndex = "1000";
      document.body.appendChild(container);
    }
  
    // 2. Create toast
    const toast = document.createElement("div");
    toast.textContent = message;
    toast.style.background = variant === "error" ? "#dc2626" : variant === "info" ? "#2563eb" : "#059669";
    toast.style.color = "white";
    toast.style.padding = "0.5rem 1rem";
    toast.style.marginTop = "0.5rem";
    toast.style.borderRadius = "0.375rem";
    toast.style.boxShadow = "0 2px 8px rgba(0,0,0,0.15)";
    toast.style.opacity = "0";
    toast.style.transition = "opacity 0.3s ease, transform 0.3s ease";
    toast.style.transform = "translateY(20px)";
  
    container.appendChild(toast);
  
    // 3. Animate in
    requestAnimationFrame(() => {
      toast.style.opacity = "1";
      toast.style.transform = "translateY(0)";
    });
  
    // 4. Remove after 3s with fade-out
    setTimeout(() => {
      toast.style.opacity = "0";
      toast.style.transform = "translateY(20px)";
      toast.addEventListener(
        "transitionend",
        () => {
          toast.remove();
          // If no more toasts, remove container
          if (!container.hasChildNodes()) container.remove();
        },
        { once: true }
      );
    }, 3000);
  }
  