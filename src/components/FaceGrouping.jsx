import React, { useState, useEffect } from 'react';
import * as faceapi from 'face-api.js';
import { Container, Row, Col, Form, Button, Card, ProgressBar, Alert } from 'react-bootstrap';

const FaceGrouping = () => {
  const [images, setImages] = useState([]);
  const [groupedFaces, setGroupedFaces] = useState([]);
  const [modelsLoaded, setModelsLoaded] = useState(false);
  const [progress, setProgress] = useState(0);
  const [isProcessing, setIsProcessing] = useState(false);

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
      } catch (error) {
        console.error('Error loading models:', error);
      }
    };
    loadModels();
  }, []);

  const handleImageUpload = async (e) => {
    if (!modelsLoaded) {
      alert('Please wait for models to load');
      return;
    }

    try {
      setIsProcessing(true);
      setProgress(0);
      const uploadedImages = Array.from(e.target.files);
      setImages(uploadedImages);
      
      const faceDescriptors = [];
      for (let i = 0; i < uploadedImages.length; i++) {
        const imgFile = uploadedImages[i];
        const img = await faceapi.bufferToImage(imgFile);
        
        const canvas = document.createElement('canvas');
        canvas.willReadFrequently = true;
        canvas.width = img.width;
        canvas.height = img.height;
        const ctx = canvas.getContext('2d');
        ctx.drawImage(img, 0, 0);
        
        const detections = await faceapi.detectAllFaces(canvas)
          .withFaceLandmarks()
          .withFaceDescriptors();
        
        if (detections?.length) {
          detections.forEach(detection => {
            faceDescriptors.push({
              image: imgFile,
              descriptor: detection.descriptor
            });
          });
        }

        setProgress(Math.round(((i + 1) / uploadedImages.length) * 100));
      }
      
      groupFaces(faceDescriptors);
      setIsProcessing(false);
    } catch (error) {
      console.error('Error processing images:', error);
      alert('Error processing images. Please try again.');
      setIsProcessing(false);
    }
  };

  const groupFaces = (faceDescriptors) => {
    const grouped = [];
    
    for (const { image, descriptor } of faceDescriptors) {
      let matchedGroup = null;
      
      for (const group of grouped) {
        const distance = faceapi.euclideanDistance(group[0].descriptor, descriptor);
        if (distance < 0.6) {
          matchedGroup = group;
          break;
        }
      }
      
      if (matchedGroup) {
        matchedGroup.push({ image, descriptor });
      } else {
        grouped.push([{ image, descriptor }]);
      }
    }
    
    setGroupedFaces(grouped);
  };

  return (
    <Container className="py-5">
      <Row className="justify-content-center">
        <Col xs={12} md={10} lg={8}>
          <h1 className="text-center mb-4">Face Grouping App</h1>
          
          <Card className="shadow-sm mb-4">
            <Card.Body>
              <Form.Group className="mb-3">
                <Form.Label>Upload Your Images</Form.Label>
                <Form.Control
                  type="file"
                  multiple
                  accept="image/*"
                  onChange={handleImageUpload}
                  disabled={!modelsLoaded || isProcessing}
                />
              </Form.Group>

              {!modelsLoaded && (
                <Alert variant="warning" className="text-center">
                  Loading AI models, please wait...
                </Alert>
              )}

              {isProcessing && (
                <div className="mb-3">
                  <p className="mb-2">Processing images... {progress}%</p>
                  <ProgressBar animated now={progress} />
                </div>
              )}

              {groupedFaces.map((group, index) => (
                <Card key={index} className="mb-3">
                  <Card.Body>
                    <Card.Title>
                      Group {index + 1} <small className="text-muted">({group.length} faces)</small>
                    </Card.Title>
                    <Row className="g-3">
                      {group.map((face, faceIndex) => (
                        <Col key={faceIndex} xs={6} sm={4} md={3}>
                          <img
                            src={URL.createObjectURL(face.image)}
                            alt={`face-${index}-${faceIndex}`}
                            width="120"
                            height="120"
                            onLoad={() => URL.revokeObjectURL(URL.createObjectURL(face.image))}
                            className="img-fluid rounded"
                          />
                        </Col>
                      ))}
                    </Row>
                  </Card.Body>
                </Card>
              ))}
            </Card.Body>
          </Card>
        </Col>
      </Row>
    </Container>
  );
};

export default FaceGrouping;
