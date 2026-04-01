import React, { useEffect, useRef } from 'react';
import './VideoIntro.css';

export const VideoIntro = ({ src, onFinish }) => {
  const videoRef = useRef(null);

  useEffect(() => {
    if (videoRef.current) {
      // Attempt unmuted play first
      const playPromise = videoRef.current.play();
      
      if (playPromise !== undefined) {
        playPromise.catch(error => {
          // Autoplay was prevented (typically due to sound)
          console.log("Unmuted autoplay failed, attempting muted play...", error);
          if (videoRef.current) {
            videoRef.current.muted = true;
            videoRef.current.play();
          }
        });
      }
    }
  }, []);

  return (
    <div className="video-intro-container">
      <video
        ref={videoRef}
        className="intro-video"
        src={src}
        autoPlay
        playsInline
        onEnded={onFinish}
      />
      <button className="skip-button" onClick={onFinish}>
        Skip Intro
      </button>
    </div>
  );
};
