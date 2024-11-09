import React, { useState, useEffect, useRef } from 'react';
import * as faceapi from 'face-api.js';
import { Container, Row, Col, Card, Alert, Spinner } from 'react-bootstrap';
import referenceImage from '../assets/img/reference.jpg';

const Facelock = () => {
  const [modelsLoaded, setModelsLoaded] = useState(false);
  const [referenceDescriptor, setReferenceDescriptor] = useState(null);
  const [isVerified, setIsVerified] = useState(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [matchPercentage, setMatchPercentage] = useState(null);
  const videoRef = useRef();
  const canvasRef = useRef();

  useEffect(() => {
    const loadModels = async () => {
      try {
        const MODEL_URL = `${window.location.origin}/models`;
        await Promise.all([
          faceapi.nets.tinyFaceDetector.loadFromUri(MODEL_URL),
          faceapi.nets.faceRecognitionNet.loadFromUri(MODEL_URL),
          faceapi.nets.faceLandmark68Net.loadFromUri(MODEL_URL)
        ]);
        setModelsLoaded(true);
        
        // Process reference image on load
        const img = await faceapi.fetchImage(referenceImage);
        const detections = await faceapi
          .detectAllFaces(img, new faceapi.TinyFaceDetectorOptions())
          .withFaceLandmarks()
          .withFaceDescriptors();
        
        if (detections[0]?.descriptor) {
          setReferenceDescriptor(detections[0].descriptor);
        }
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

    if (modelsLoaded) {
      startVideo();
    }
  }, [modelsLoaded]);

  useEffect(() => {
    if (!modelsLoaded || !videoRef.current || !referenceDescriptor) return;

    const verifyFace = async () => {
      const video = videoRef.current;
      const canvas = canvasRef.current;

      if (!video || !canvas) return;

      const displaySize = { width: video.width, height: video.height };
      faceapi.matchDimensions(canvas, displaySize);

      setInterval(async () => {
        setIsProcessing(true);
        const detections = await faceapi
          .detectAllFaces(video, new faceapi.TinyFaceDetectorOptions())
          .withFaceLandmarks()
          .withFaceDescriptors();

        const resizedDetections = faceapi.resizeResults(detections, displaySize);
        canvas.getContext('2d').clearRect(0, 0, canvas.width, canvas.height);
        faceapi.draw.drawDetections(canvas, resizedDetections);

        if (detections[0]?.descriptor) {
          const distance = faceapi.euclideanDistance(referenceDescriptor, detections[0].descriptor);
          const percentage = Math.max(0, Math.round((1 - distance) * 100));
          setMatchPercentage(percentage);
          setIsVerified(distance < 0.5);
        } else {
          setMatchPercentage(0);
          setIsVerified(false);
        }
        setIsProcessing(false);
      }, 100);
    };

    videoRef.current.addEventListener('play', verifyFace);

    return () => {
      if (videoRef.current) {
        videoRef.current.removeEventListener('play', verifyFace);
      }
    };
  }, [modelsLoaded, referenceDescriptor]);

  return (
    <Container className="py-5">
      <Row className="justify-content-center">
        <Col xs={12} md={10}>
          <Card className="shadow-sm">
            <Card.Body>
              <h2 className="text-center mb-4">Face Verification</h2>

              {!modelsLoaded && (
                <Alert variant="warning" className="text-center">
                  Loading AI models, please wait...
                </Alert>
              )}

              <Row>
                <Col md={6}>
                  <div className="mb-4">
                    <h5>Reference Image:</h5>
                    <img
                      src={referenceImage}
                      alt="Reference"
                      className="mt-3 img-fluid rounded"
                      style={{ maxHeight: '300px', width: '100%', objectFit: 'cover' }}
                    />
                  </div>
                </Col>

                <Col md={6}>
                  <h5>Live Verification:</h5>
                  <div className="position-relative d-inline-block">
                    <video
                      ref={videoRef}
                      autoPlay
                      muted
                      width="400"
                      height="300"
                    />
                    <canvas
                      ref={canvasRef}
                      width="400"
                      height="300"
                      style={{
                        position: 'absolute',
                        top: 0,
                        left: 0,
                        width: '100%',
                        height: '100%'
                      }}
                    />
                  </div>
                </Col>
              </Row>

              {isProcessing && (
                <div className="text-center my-4">
                  <Spinner animation="border" role="status" />
                  <p className="mt-2">Processing video...</p>
                </div>
              )}

              {matchPercentage !== null && !isProcessing && (
                <div className="text-center">
                  <h4>Match Percentage: {matchPercentage}%</h4>
                  <Alert variant={isVerified ? "success" : "danger"} className="mt-3">
                    {isVerified ? "Face Verified ✓" : "Face Not Verified ✗"}
                  </Alert>
                </div>
              )}
            </Card.Body>
          </Card>
        </Col>
      </Row>
    </Container>
  );
};

export default Facelock;