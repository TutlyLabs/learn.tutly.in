import React, { useEffect, useRef } from "react";
import Plyr from "plyr";
import "plyr/dist/plyr.css";
import Hls from "hls.js";

interface VideoPlayerProps {
  videoUrl: string;
}

const VideoPlayer: React.FC<VideoPlayerProps> = ({ videoUrl }) => {
  const videoRef = useRef<HTMLVideoElement | null>(null);

  useEffect(() => {
    const video = videoRef.current;

    if (video) {
      const plyrInstance = new Plyr(video, {
        keyboard: {
          focused: true,
          global: true,
        },
        seekTime: 10,
        tooltips: {
          controls: true,
        },
        captions: {
          active: true,
        },

        // just for future needs 
      /* ads: {
        enabled: isProduction,
        publisherId: '918848828995742',
      }, */
      // previewThumbnails: {
      //   enabled: true,
      //   src: ['https://cdn.plyr.io/static/demo/thumbs/100p.vtt', 'https://cdn.plyr.io/static/demo/thumbs/240p.vtt'],
      // },
      // vimeo: {
      //   // Prevent Vimeo blocking plyr.io demo site
      //   referrerPolicy: 'no-referrer',
      // },
      // mediaMetadata: {
      //   title: 'View From A Blue Moon',
      //   album: 'Sports',
      //   artist: 'Brainfarm',
      //   artwork: [
      //     {
      //       src: 'https://cdn.plyr.io/static/demo/View_From_A_Blue_Moon_Trailer-HD.jpg',
      //       type: 'image/jpeg',
      //     },
      //   ],
      // },
      // markers: {
      //   enabled: true,
      //   points: [
      //     {
      //       time: 10,
      //       label: 'first marker',
      //     },
      //     {
      //       time: 40,
      //       label: 'second marker',
      //     },
      //     {
      //       time: 120,
      //       label: '<strong>third</strong> marker',
      //     },
      //   ],
      // },
      });

      if (Hls.isSupported()) {
        const hls = new Hls();
        hls.loadSource(videoUrl);
        hls.attachMedia(video);
        hls.on(Hls.Events.MANIFEST_PARSED, () => {
          plyrInstance.play();
        });

        return () => {
          hls.destroy();
          plyrInstance.destroy();
        };
      } else if (video.canPlayType("application/vnd.apple.mpegurl")) {
        video.src = videoUrl;
        plyrInstance.play();
      } else {
        console.error("HLS is not supported in this browser.");
      }
    }

    return () => {};
  }, [videoUrl]);

  return (
    <div className="">
      <video ref={videoRef} controls className="plyr__video-embed" />
    </div>
  );
};

export default VideoPlayer;
