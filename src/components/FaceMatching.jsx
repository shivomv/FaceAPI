import React, { useState, useRef, useEffect } from 'react';
import * as faceapi from 'face-api.js';
import { Button, Alert } from 'react-bootstrap';

const FaceMatching = () => {
  const [image1, setImage1] = useState(null);
  const [image2, setImage2] = useState(null);
  const [similarity, setSimilarity] = useState(null);
  const [error, setError] = useState(null);
  const image1Ref = useRef();
  const image2Ref = useRef();

  useEffect(() => {
    loadModels();
  }, []);

  const loadModels = async () => {
    try {
      await Promise.all([
        faceapi.nets.tinyFaceDetector.loadFromUri('/models'),
        faceapi.nets.faceLandmark68Net.loadFromUri('/models'),
        faceapi.nets.faceRecognitionNet.loadFromUri('/models')
      ]);
    } catch (error) {
      setError('Error loading models. Please try again later.');
    }
  };

  const handleImageUpload = (imageNum, e) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (e) => {
        if (imageNum === 1) {
          setImage1(e.target.result);
        } else {
          setImage2(e.target.result);
        }
      };
      reader.readAsDataURL(file);
    }
  };

  const calculateSimilarity = async () => {
    if (!image1 || !image2) {
      setError('Please upload both images first.');
      return;
    }

    try {
      setError(null);

      // Detect faces and get descriptors for both images
      const detection1 = await faceapi
        .detectSingleFace(image1Ref.current, new faceapi.TinyFaceDetectorOptions())
        .withFaceLandmarks()
        .withFaceDescriptor();

      const detection2 = await faceapi
        .detectSingleFace(image2Ref.current, new faceapi.TinyFaceDetectorOptions())
        .withFaceLandmarks()
        .withFaceDescriptor();

      if (!detection1 || !detection2) {
        setError('Could not detect faces in one or both images.');
        return;
      }

      // Calculate similarity using Euclidean distance
      const distance = faceapi.euclideanDistance(detection1.descriptor, detection2.descriptor);
      const similarityScore = Math.max(0, 100 * (1 - distance));
      setSimilarity(similarityScore.toFixed(2));

    } catch (error) {
      setError('Error comparing faces. Please try again.');
    }
  };

  return (
    <div className="text-center">
      <h2>Face Matching</h2>

      <div className="d-flex justify-content-center gap-4 mb-3">
        <div>
          <h4>Image 1</h4>
          <input
            type="file"
            accept="image/*"
            onChange={(e) => handleImageUpload(1, e)}
            className="form-control mb-2"
          />
          {image1 && (
            <img
              ref={image1Ref}
              src={image1}
              alt="First face"
              style={{ maxWidth: '300px', height: 'auto' }}
            />
          )}
        </div>

        <div>
          <h4>Image 2</h4>
          <input
            type="file"
            accept="image/*"
            onChange={(e) => handleImageUpload(2, e)}
            className="form-control mb-2"
          />
          {image2 && (
            <img
              ref={image2Ref}
              src={image2}
              alt="Second face"
              style={{ maxWidth: '300px', height: 'auto' }}
            />
          )}
        </div>
      </div>

      {error && <Alert variant="danger">{error}</Alert>}

      <Button
        onClick={calculateSimilarity}
        disabled={!image1 || !image2}
        className="mb-3"
      >
        Compare Faces
      </Button>

      {similarity !== null && (
        <div className="mt-3">
          <h3>Similarity Score: {similarity}%</h3>
        </div>
      )}
    </div>
  );
};

export default FaceMatching;
