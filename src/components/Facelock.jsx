import React, { useState, useEffect, useRef } from 'react';
import * as faceapi from 'face-api.js';
import { Container, Row, Col, Form, Button, Card, Alert, Spinner } from 'react-bootstrap';
import referenceImage from '../assets/img/reference.jpg';

const Facelock = () => {
  const [modelsLoaded, setModelsLoaded] = useState(false);
  const [referenceDescriptor, setReferenceDescriptor] = useState(null);
  const [verificationImage, setVerificationImage] = useState(null);
  const [isVerified, setIsVerified] = useState(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [matchPercentage, setMatchPercentage] = useState(null);

  useEffect(() => {
    const loadModels = async () => {
      try {
        const MODEL_URL = `${window.location.origin}/models`;
        await Promise.all([
          faceapi.nets.ssdMobilenetv1.loadFromUri(MODEL_URL),
          faceapi.nets.faceRecognitionNet.loadFromUri(MODEL_URL),
          faceapi.nets.faceLandmark68Net.loadFromUri(MODEL_URL)
        ]);
        setModelsLoaded(true);
        
        // Process reference image on load
        const img = await faceapi.fetchImage(referenceImage);
        const canvas = document.createElement('canvas');
        canvas.willReadFrequently = true;
        canvas.width = img.width;
        canvas.height = img.height;
        const ctx = canvas.getContext('2d');
        ctx.drawImage(img, 0, 0);

        const detections = await faceapi.detectAllFaces(canvas)
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

  const processImage = async (imageFile) => {
    const img = await faceapi.bufferToImage(imageFile);
    const canvas = document.createElement('canvas');
    canvas.willReadFrequently = true;
    canvas.width = img.width;
    canvas.height = img.height;
    const ctx = canvas.getContext('2d');
    ctx.drawImage(img, 0, 0);

    const detections = await faceapi.detectAllFaces(canvas)
      .withFaceLandmarks()
      .withFaceDescriptors();

    return detections[0]?.descriptor;
  };

  const handleImageUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    setIsProcessing(true);
    setVerificationImage(file);
    
    try {
      const descriptor = await processImage(file);
      
      if (descriptor && referenceDescriptor) {
        const distance = faceapi.euclideanDistance(referenceDescriptor, descriptor);
        const percentage = Math.max(0, Math.round((1 - distance) * 100));
        setMatchPercentage(percentage);
        setIsVerified(distance < 0.5);
      } else {
        setMatchPercentage(0);
        setIsVerified(false);
      }
    } catch (err) {
      console.error("Error processing image:", err);
      alert("Error processing image. Please try another image.");
    } finally {
      setIsProcessing(false);
    }
  };

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
                  <Form.Group className="mb-4">
                    <h5>Verification Image:</h5>
                    <Form.Control
                      type="file"
                      accept="image/*"
                      onChange={handleImageUpload}
                      disabled={!modelsLoaded || !referenceDescriptor || isProcessing}
                      className="mb-3"
                    />
                    {verificationImage && (
                      <img
                        src={URL.createObjectURL(verificationImage)}
                        alt="Verification"
                        className="mt-3 img-fluid rounded"
                        style={{ maxHeight: '300px', width: '100%', objectFit: 'cover' }}
                        onLoad={() => URL.revokeObjectURL(URL.createObjectURL(verificationImage))}
                      />
                    )}
                  </Form.Group>
                </Col>
              </Row>

              {isProcessing && (
                <div className="text-center my-4">
                  <Spinner animation="border" role="status" />
                  <p className="mt-2">Processing image...</p>
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