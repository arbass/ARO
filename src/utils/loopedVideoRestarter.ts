export const loopedVideoRestarter = () => {
  const loopedVideos = document.querySelectorAll('video[loop]');

  if (loopedVideos.length === 0) {
    return;
  }

  const ensureVideoPlays = (video: HTMLVideoElement) => {
    if (!video.paused) {
      return;
    }

    const playPromise = video.play();

    if (playPromise instanceof Promise) {
      playPromise.catch((error) => {
        console.warn('LoopedVideoRestarter: Failed to trigger playback', error);
      });
    }
  };

  const kickstartVideo = (video: HTMLVideoElement) => {
    if (video.autoplay && video.muted === false) {
      video.muted = true;
    }

    if (video.readyState >= HTMLMediaElement.HAVE_CURRENT_DATA) {
      ensureVideoPlays(video);
      return;
    }

    const handleLoadedData = () => {
      video.removeEventListener('loadeddata', handleLoadedData);
      ensureVideoPlays(video);
    };

    video.addEventListener('loadeddata', handleLoadedData);
  };

  const restartAllVideos = () => {
    loopedVideos.forEach((videoElement) => {
      const video = videoElement as HTMLVideoElement;
      ensureVideoPlays(video);
    });
  };

  const handleVisibilityChange = () => {
    if (document.visibilityState === 'visible') {
      restartAllVideos();
    }
  };

  const handlePageShow = (event: PageTransitionEvent) => {
    if (event.persisted) {
      restartAllVideos();
    }
  };

  loopedVideos.forEach((videoElement) => {
    const video = videoElement as HTMLVideoElement;
    kickstartVideo(video);
  });

  document.addEventListener('visibilitychange', handleVisibilityChange);
  window.addEventListener('pageshow', handlePageShow);

  return () => {
    document.removeEventListener('visibilitychange', handleVisibilityChange);
    window.removeEventListener('pageshow', handlePageShow);
  };
};

