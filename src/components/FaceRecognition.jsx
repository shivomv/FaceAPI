import React, { useState, useRef, useEffect } from 'react';
import * as faceapi from 'face-api.js';
import { Button, Spinner, Alert } from 'react-bootstrap';

const FaceRecognition = () => {
  const [image, setImage] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [labeledDescriptors, setLabeledDescriptors] = useState([]);
  const [faceMatcher, setFaceMatcher] = useState(null);
  const [selectedFaceBox, setSelectedFaceBox] = useState(null);
  const imageRef = useRef();
  const canvasRef = useRef();

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
          setSelectedFaceBox(null);
        };
        img.src = e.target.result;
      };
      reader.readAsDataURL(file);
    }
  };

  const recognizeFaces = async () => {
    if (!image) return;

    try {
      setLoading(true);
      setError(null);

      const detections = await faceapi
        .detectAllFaces(imageRef.current, new faceapi.TinyFaceDetectorOptions())
        .withFaceLandmarks()
        .withFaceDescriptors();

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

      if (faceMatcher) {
        resizedDetections.forEach(detection => {
          const bestMatch = faceMatcher.findBestMatch(detection.descriptor);
          const box = detection.detection.box;
          const drawBox = new faceapi.draw.DrawBox(box, { 
            label: bestMatch.toString(),
            boxColor: 'blue'
          });
          drawBox.draw(canvas);
        });
      } else {
        faceapi.draw.drawDetections(canvas, resizedDetections);
      }

    } catch (error) {
      setError('Error recognizing faces. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleCanvasClick = async (e) => {
    if (!image) return;

    try {
      const rect = canvasRef.current.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;

      const detections = await faceapi
        .detectAllFaces(imageRef.current, new faceapi.TinyFaceDetectorOptions())
        .withFaceLandmarks();

      const displaySize = {
        width: imageRef.current.width,
        height: imageRef.current.height
      };

      const resizedDetections = faceapi.resizeResults(detections, displaySize);

      // Find which face box was clicked
      const clickedFace = resizedDetections.find(detection => {
        const box = detection.detection.box;
        return (
          x >= box.x &&
          x <= box.x + box.width &&
          y >= box.y &&
          y <= box.y + box.height
        );
      });

      if (clickedFace) {
        setSelectedFaceBox(clickedFace.detection.box);
        // Highlight selected face
        const canvas = canvasRef.current;
        const context = canvas.getContext('2d');
        context.clearRect(0, 0, canvas.width, canvas.height);
        
        resizedDetections.forEach(detection => {
          const box = detection.detection.box;
          const drawBox = new faceapi.draw.DrawBox(box, {
            boxColor: detection === clickedFace ? 'green' : 'blue'
          });
          drawBox.draw(canvas);
        });
      }
    } catch (error) {
      setError('Error selecting face. Please try again.');
    }
  };

  const addFaceDescriptor = async () => {
    if (!image || !selectedFaceBox) {
      setError('Please select a face first by clicking on it.');
      return;
    }

    try {
      setLoading(true);
      setError(null);

      const label = prompt('Enter a name for this face:');
      if (!label) return;

      const detections = await faceapi
        .detectAllFaces(imageRef.current, new faceapi.TinyFaceDetectorOptions())
        .withFaceLandmarks()
        .withFaceDescriptors();

      const displaySize = {
        width: imageRef.current.width,
        height: imageRef.current.height
      };

      const resizedDetections = faceapi.resizeResults(detections, displaySize);

      // Find the selected face's descriptor
      const selectedFace = resizedDetections.find(detection => {
        const box = detection.detection.box;
        return (
          box.x === selectedFaceBox.x &&
          box.y === selectedFaceBox.y &&
          box.width === selectedFaceBox.width &&
          box.height === selectedFaceBox.height
        );
      });

      if (selectedFace) {
        const newDescriptor = new faceapi.LabeledFaceDescriptors(label, [selectedFace.descriptor]);
        setLabeledDescriptors(prev => [...prev, newDescriptor]);
        setFaceMatcher(new faceapi.FaceMatcher([...labeledDescriptors, newDescriptor]));
        setSelectedFaceBox(null);
      }
    } catch (error) {
      setError('Error adding face descriptor. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="text-center">
      <h2>Face Recognition</h2>
      
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
              onClick={handleCanvasClick}
              style={{
                position: 'absolute',
                top: 0,
                left: 0,
                width: '100%',
                height: '100%',
                cursor: 'pointer'
              }}
            />
          </>
        )}
      </div>

      {image && (
        <div className="mt-3">
          <Button
            onClick={addFaceDescriptor}
            disabled={loading || !selectedFaceBox}
            variant="secondary"
            className="me-2"
          >
            Add Selected Face
          </Button>
          <Button
            onClick={recognizeFaces}
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
                Processing...
              </>
            ) : (
              'Recognize Faces'
            )}
          </Button>
        </div>
      )}
    </div>
  );
};

export default FaceRecognition;