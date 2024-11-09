import React, { useState, useRef, useEffect } from 'react';
import * as faceapi from 'face-api.js';
import { Button, Spinner, Alert } from 'react-bootstrap';

const FaceDetection = () => {
  const [image, setImage] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const imageRef = useRef();
  const canvasRef = useRef();

  useEffect(() => {
    loadModels();
  }, []);

  const loadModels = async () => {
    try {
      await faceapi.nets.tinyFaceDetector.loadFromUri('/models');
    } catch (error) {
      setError('Error loading models. Please try again later.');
    }
  };

  const handleImageUpload = (e) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (e) => {
        // Create an image element to get dimensions
        const img = new Image();
        img.onload = () => {
          // Create canvas for resizing
          const canvas = document.createElement('canvas');
          let width = img.width;
          let height = img.height;
          
          // Maximum dimensions
          const MAX_WIDTH = 800;
          const MAX_HEIGHT = 600;

          // Calculate new dimensions while maintaining aspect ratio
          if (width > height) {
            if (width > MAX_WIDTH) {
              height *= MAX_WIDTH / width;
              width = MAX_WIDTH;
            }
          } else {
            if (height > MAX_HEIGHT) {
              width *= MAX_HEIGHT / height;
              height = MAX_HEIGHT;
            }
          }

          // Set canvas dimensions and draw resized image
          canvas.width = width;
          canvas.height = height;
          const ctx = canvas.getContext('2d');
          ctx.drawImage(img, 0, 0, width, height);

          // Convert canvas to data URL
          const resizedImage = canvas.toDataURL('image/jpeg', 0.8);
          setImage(resizedImage);
        };
        img.src = e.target.result;
      };
      reader.readAsDataURL(file);
    }
  };

  const detectFaces = async () => {
    if (!image) return;

    try {
      setLoading(true);
      setError(null);
      
      const detections = await faceapi
        .detectAllFaces(imageRef.current, new faceapi.TinyFaceDetectorOptions());

      // Get display size based on the image's dimensions
      const displaySize = {
        width: imageRef.current.width,
        height: imageRef.current.height
      };

      // Resize canvas to match image dimensions
      const canvas = canvasRef.current;
      canvas.width = displaySize.width;
      canvas.height = displaySize.height;

      // Resize detections to match display size
      const resizedDetections = faceapi.resizeResults(detections, displaySize);
      
      const context = canvas.getContext('2d');
      context.clearRect(0, 0, canvas.width, canvas.height);
      
      // Draw the resized detections
      faceapi.draw.drawDetections(canvas, resizedDetections);
    } catch (error) {
      setError('Error detecting faces. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="text-center">
      <h2>Face Detection</h2>
      
      <div className="mb-3">
        <input
          type="file"
          accept="image/*"
          onChange={handleImageUpload}
          className="form-control"
        />
      </div>

      {error && <Alert variant="danger">{error}</Alert>}

      <div className="position-relative d-inline-block">
        {image && (
          <>
            <img
              ref={imageRef}
              src={image}
              alt="Upload"
              style={{ maxWidth: '100%', height: 'auto' }}
              crossOrigin="anonymous"
            />
            <canvas
              ref={canvasRef}
              style={{
                position: 'absolute',
                top: 0,
                left: 0,
                width: '100%',
                height: '100%'
              }}
            />
          </>
        )}
      </div>

      {image && (
        <div className="mt-3">
          <Button
            onClick={detectFaces}
            disabled={loading}
            variant="primary"
          >
            {loading ? (
              <>
                <Spinner
                  as="span"
                  animation="border"
                  size="sm"
                  role="status"
                  aria-hidden="true"
                  className="me-2"
                />
                Detecting...
              </>
            ) : (
              'Detect Faces'
            )}
          </Button>
        </div>
      )}
    </div>
  );
};

export default FaceDetection;