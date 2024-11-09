import React, { useState, useRef, useEffect } from 'react';
import * as faceapi from 'face-api.js';
import { Button, Spinner, Alert } from 'react-bootstrap';

const AgeGender = () => {
  const [image, setImage] = useState(null);
  const [results, setResults] = useState(null);
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
        faceapi.nets.ageGenderNet.loadFromUri('/models')
      ]);
    } catch (error) {
      setError('Error loading models. Please try again later.');
    }
  };

  const handleImageUpload = (e) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (e) => setImage(e.target.result);
      reader.readAsDataURL(file);
    }
  };

  const detectAgeGender = async () => {
    if (!image) return;

    try {
      setLoading(true);
      setError(null);
      
      const detections = await faceapi
        .detectAllFaces(imageRef.current, new faceapi.TinyFaceDetectorOptions())
        .withAgeAndGender();

      const canvas = canvasRef.current;
      canvas.width = imageRef.current.width;
      canvas.height = imageRef.current.height;
      
      const context = canvas.getContext('2d');
      context.clearRect(0, 0, canvas.width, canvas.height);
      
      faceapi.draw.drawDetections(canvas, detections);
      
      setResults(detections);
    } catch (error) {
      setError('Error detecting age and gender. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="text-center">
      <h2>Age & Gender Detection</h2>
      
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
            />
            <canvas
              ref={canvasRef}
              style={{
                position: 'absolute',
                top: 0,
                left: 0
              }}
            />
          </>
        )}
      </div>

      {image && (
        <div className="mt-3">
          <Button 
            onClick={detectAgeGender}
            disabled={loading}
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
                Processing...
              </>
            ) : (
              'Detect Age & Gender'
            )}
          </Button>
        </div>
      )}

      {results && (
        <div className="mt-3">
          <h3>Results:</h3>
          {results.map((result, index) => (
            <div key={index} className="mb-2">
              <p>
                Age: Approx {Math.round(result.age)} years
                <br />
                Gender: {result.gender} 
              </p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default AgeGender;