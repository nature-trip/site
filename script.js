const revealTargets = document.querySelectorAll(".reveal");
const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

if (reduceMotion) {
  revealTargets.forEach((target) => target.classList.add("is-visible"));
} else {
  const revealObserver = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add("is-visible");
          revealObserver.unobserve(entry.target);
        }
      });
    },
    {
      threshold: 0.12,
      rootMargin: "0px 0px -12px 0px",
    },
  );

  revealTargets.forEach((target) => revealObserver.observe(target));
}

function initSliderVideoPlayback() {
  const sliders = Array.from(document.querySelectorAll(".hotel-slider")).filter(
    (slider) => slider.querySelector("video"),
  );

  if (sliders.length === 0) {
    return;
  }

  const ACTIVE_THRESHOLD = 0.72;

  const getVisibleRatio = (targetRect, rootRect) => {
    const overlapX = Math.max(
      0,
      Math.min(targetRect.right, rootRect.right) - Math.max(targetRect.left, rootRect.left),
    );
    const overlapY = Math.max(
      0,
      Math.min(targetRect.bottom, rootRect.bottom) - Math.max(targetRect.top, rootRect.top),
    );
    const overlapArea = overlapX * overlapY;
    const targetArea = Math.max(targetRect.width * targetRect.height, 1);
    return overlapArea / targetArea;
  };

  const syncSlider = (slider) => {
    const videos = Array.from(slider.querySelectorAll("video"));
    if (videos.length === 0) {
      return;
    }

    const sliderRect = slider.getBoundingClientRect();
    let bestVideo = null;
    let bestRatio = 0;

    videos.forEach((video) => {
      const ratio = getVisibleRatio(video.getBoundingClientRect(), sliderRect);
      if (ratio > bestRatio) {
        bestRatio = ratio;
        bestVideo = video;
      }
    });

    videos.forEach((video) => {
      const shouldPlay =
        document.visibilityState === "visible" &&
        bestVideo === video &&
        bestRatio >= ACTIVE_THRESHOLD;

      if (shouldPlay) {
        const playPromise = video.play();
        if (playPromise && typeof playPromise.catch === "function") {
          playPromise.catch(() => {});
        }
      } else {
        video.pause();
      }
    });
  };

  const syncAll = () => {
    sliders.forEach((slider) => syncSlider(slider));
  };

  sliders.forEach((slider) => {
    slider.querySelectorAll("video").forEach((video) => {
      video.muted = true;
      video.playsInline = true;
      video.pause();
    });
    slider.addEventListener("scroll", syncAll, { passive: true });
  });

  window.addEventListener("resize", syncAll);
  document.addEventListener("visibilitychange", syncAll);
  window.addEventListener("load", syncAll, { once: true });
  requestAnimationFrame(syncAll);
}

initSliderVideoPlayback();

const directLinks = document.querySelectorAll(".js-direct-link[data-fallback]");
const FALLBACK_DELAY_MS = 900;

directLinks.forEach((link) => {
  link.addEventListener("click", (event) => {
    if (
      event.button !== 0 ||
      event.metaKey ||
      event.ctrlKey ||
      event.shiftKey ||
      event.altKey
    ) {
      return;
    }

    const fallbackUrl = link.dataset.fallback;
    if (!fallbackUrl) {
      return;
    }

    let cleared = false;

    const cleanup = () => {
      if (cleared) {
        return;
      }
      cleared = true;
      window.clearTimeout(fallbackTimer);
      window.removeEventListener("blur", cleanup);
      window.removeEventListener("pagehide", cleanup);
      document.removeEventListener("visibilitychange", onVisibilityChange);
    };

    const onVisibilityChange = () => {
      if (document.visibilityState === "hidden") {
        cleanup();
      }
    };

    const fallbackTimer = window.setTimeout(() => {
      cleanup();
      window.location.href = fallbackUrl;
    }, FALLBACK_DELAY_MS);

    window.addEventListener("blur", cleanup, { once: true });
    window.addEventListener("pagehide", cleanup, { once: true });
    document.addEventListener("visibilitychange", onVisibilityChange);
  });
});
