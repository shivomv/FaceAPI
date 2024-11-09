import React, { useState, useRef, useEffect } from 'react';
import * as faceapi from 'face-api.js';

const FaceLandmarks = () => {
  const [isModelLoaded, setIsModelLoaded] = useState(false);
  const videoRef = useRef();
  const canvasRef = useRef();

  useEffect(() => {
    const loadModels = async () => {
      try {
        await Promise.all([
          faceapi.nets.tinyFaceDetector.loadFromUri('/models'),
          faceapi.nets.faceLandmark68Net.loadFromUri('/models'),
        ]);
        setIsModelLoaded(true);
      } catch (error) {
        console.error('Error loading models:', error);
      }
    };
    loadModels();
  }, []);

  useEffect(() => {
    const startVideo = async () => {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ video: true });
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
        }
      } catch (error) {
        console.error('Error accessing webcam:', error);
      }
    };

    if (isModelLoaded) {
      startVideo();
    }
  }, [isModelLoaded]);

  useEffect(() => {
    if (!isModelLoaded || !videoRef.current) return;

    const detectFaceLandmarks = async () => {
      const video = videoRef.current;
      const canvas = canvasRef.current;

      if (!video || !canvas) return;

      const displaySize = { width: video.width, height: video.height };
      faceapi.matchDimensions(canvas, displaySize);

      setInterval(async () => {
        const detections = await faceapi
          .detectAllFaces(video, new faceapi.TinyFaceDetectorOptions())
          .withFaceLandmarks();

        const resizedDetections = faceapi.resizeResults(detections, displaySize);
        canvas.getContext('2d').clearRect(0, 0, canvas.width, canvas.height);
        faceapi.draw.drawFaceLandmarks(canvas, resizedDetections);
      }, 100);
    };

    videoRef.current.addEventListener('play', detectFaceLandmarks);

    return () => {
      if (videoRef.current) {
        videoRef.current.removeEventListener('play', detectFaceLandmarks);
      }
    };
  }, [isModelLoaded]);

  return (
    <div className="text-center">
      <h2>Face Landmarks Detection</h2>
      <div className="position-relative d-inline-block">
        <video
          ref={videoRef}
          autoPlay
          muted
          width="720"
          height="560"
        />
        <canvas
          ref={canvasRef}
          width="720"
          height="560"
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            width: '100%',
            height: '100%'
          }}
        />
      </div>
      {!isModelLoaded && <p>Loading face detection models...</p>}
    </div>
  );
};

export default FaceLandmarks;