import React, { useState, useRef, useEffect } from 'react';
import * as faceapi from 'face-api.js';
import { Button, Spinner, Alert } from 'react-bootstrap';

const FaceExpression = () => {
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
      await Promise.all([
        faceapi.nets.tinyFaceDetector.loadFromUri('/models'),
        faceapi.nets.faceExpressionNet.loadFromUri('/models')
      ]);
    } catch (error) {
      setError('Error loading models. Please try again later.');
    }
  };

  const handleImageUpload = (e) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (e) => {
        const img = new Image();
        img.onload = () => {
          const canvas = document.createElement('canvas');
          let width = img.width;
          let height = img.height;
          
          const MAX_WIDTH = 800;
          const MAX_HEIGHT = 600;

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

          canvas.width = width;
          canvas.height = height;
          const ctx = canvas.getContext('2d');
          ctx.drawImage(img, 0, 0, width, height);

          const resizedImage = canvas.toDataURL('image/jpeg', 0.8);
          setImage(resizedImage);
        };
        img.src = e.target.result;
      };
      reader.readAsDataURL(file);
    }
  };

  const detectExpressions = async () => {
    if (!image) return;

    try {
      setLoading(true);
      setError(null);
      
      const detections = await faceapi
        .detectAllFaces(imageRef.current, new faceapi.TinyFaceDetectorOptions())
        .withFaceExpressions();

      const displaySize = {
        width: imageRef.current.width,
        height: imageRef.current.height
      };

      const canvas = canvasRef.current;
      canvas.width = displaySize.width;
      canvas.height = displaySize.height;
      
      const resizedDetections = faceapi.resizeResults(detections, displaySize);
      
      const context = canvas.getContext('2d');
      context.clearRect(0, 0, canvas.width, canvas.height);
      
      faceapi.draw.drawDetections(canvas, resizedDetections);
      faceapi.draw.drawFaceExpressions(canvas, resizedDetections);
    } catch (error) {
      setError('Error detecting expressions. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="text-center">
      <h2>Face Expression Analysis</h2>
      
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
            onClick={detectExpressions}
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
                Analyzing...
              </>
            ) : (
              'Analyze Expressions'
            )}
          </Button>
        </div>
      )}
    </div>
  );
};

export default FaceExpression;