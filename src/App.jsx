import React from 'react'
import { BrowserRouter, Routes, Route, Link } from 'react-router-dom'
import { Nav, Container, Navbar } from 'react-bootstrap'
import FaceDetection from './components/FaceDetection'
import FaceRecognition from './components/FaceRecognition'
import FaceExpression from './components/FaceExpression'
import FaceLandmarks from './components/FaceLandmarks'
import AgeGender from './components/AgeGender'
import FaceGrouping from './components/FaceGrouping'
import Facelock from './components/Facelock'
import FaceMatching from './components/FaceMatching'

const App = () => {
  return (
    <BrowserRouter>
      <div className="app-container">
        <Navbar bg="dark" variant="dark" expand="lg">
          <Container>
            <Navbar.Brand as={Link} to="/">Face API Features Demo</Navbar.Brand>
            <Navbar.Toggle aria-controls="basic-navbar-nav" />
            <Navbar.Collapse id="basic-navbar-nav">
              <Nav className="me-auto">
                <Nav.Link as={Link} to="/detection">Face Detection</Nav.Link>
                <Nav.Link as={Link} to="/recognition">Face Recognition</Nav.Link>
                <Nav.Link as={Link} to="/expression">Face Expression</Nav.Link>
                <Nav.Link as={Link} to="/landmarks">Face Landmarks</Nav.Link>
                <Nav.Link as={Link} to="/age-gender">Age & Gender</Nav.Link>
                <Nav.Link as={Link} to="/facelock">Facelock</Nav.Link>
                <Nav.Link as={Link} to="/grouping">Face Grouping</Nav.Link>
                <Nav.Link as={Link} to="/matching">Face Matching</Nav.Link>
              </Nav>
            </Navbar.Collapse>
          </Container>
        </Navbar>

        <Container className="mt-4">
          <Routes>
            <Route path="/detection" element={<FaceDetection />} />
            <Route path="/recognition" element={<FaceRecognition />} />
            <Route path="/expression" element={<FaceExpression />} />
            <Route path="/landmarks" element={<FaceLandmarks />} />
            <Route path="/age-gender" element={<AgeGender />} />
            <Route path="/facelock" element={<Facelock />} />
            <Route path="/grouping" element={<FaceGrouping />} />
            <Route path="/matching" element={<FaceMatching />} />
            <Route path="/" element={
              <div className="text-center">
                <h2>Welcome to Face API Features Demo</h2>
                <p>Please select a feature from the navigation menu above.</p>
              </div>
            } />
          </Routes>
        </Container>
      </div>
    </BrowserRouter>
  );
};

export default App