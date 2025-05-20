import React from 'react';
import { Container, Row, Col } from 'reactstrap';
import { Link } from 'react-router-dom';
import { FaHospital, FaPhone, FaEnvelope, FaMapMarkerAlt, FaFacebook, FaTwitter, FaLinkedin } from 'react-icons/fa';

const Footer = () => {
  return (
    <footer className="footer">
      <Container>
        <Row className="py-4">
          <Col lg={4} className="mb-4 mb-lg-0">
            <div className="d-flex align-items-center mb-3">
              <FaHospital size={20} className="me-2" />
              <h5 className="mb-0">FeelWell</h5>
            </div>
            <p className="small">
              Providing comprehensive healthcare solutions with cutting-edge technology for better patient outcomes.
            </p>
            <div className="d-flex mt-3">
              <a href="https://facebook.com" className="me-3" target="_blank" rel="noopener noreferrer">
                <FaFacebook size={20} />
              </a>
              <a href="https://twitter.com" className="me-3" target="_blank" rel="noopener noreferrer">
                <FaTwitter size={20} />
              </a>
              <a href="https://linkedin.com" target="_blank" rel="noopener noreferrer">
                <FaLinkedin size={20} />
              </a>
            </div>
          </Col>
          <Col lg={4} className="mb-4 mb-lg-0">
            <h5 className="mb-3">Quick Links</h5>
            <ul className="list-unstyled">
              <li className="mb-2"><Link to="/">Home</Link></li>
              <li className="mb-2"><Link to="/chat">AI Health Assistant</Link></li>
              <li className="mb-2"><Link to="/login">Patient Portal</Link></li>
              <li className="mb-2"><Link to="/register">Register</Link></li>
            </ul>
          </Col>
          <Col lg={4}>
            <h5 className="mb-3">Contact Information</h5>
            <div className="mb-2 d-flex align-items-center">
              <FaPhone size={16} className="me-2" />
              <span>+1 (800) 555-1234</span>
            </div>
            <div className="mb-2 d-flex align-items-center">
              <FaEnvelope size={16} className="me-2" />
              <span>contact@feelwell.com</span>
            </div>
            <div className="mb-2 d-flex align-items-center">
              <FaMapMarkerAlt size={16} className="me-2" />
              <span>123 Medical Center Drive, Healthtown, HT 12345</span>
            </div>
            <p className="mt-3 small">
              <strong>Emergency Services:</strong> (800) 911-1234
            </p>
          </Col>
        </Row>
        <Row className="pt-3 border-top border-secondary">
          <Col className="text-center">
            <p className="small mb-0">
              &copy; {new Date().getFullYear()} FeelWell Health Portal. All rights reserved.
            </p>
          </Col>
        </Row>
      </Container>
    </footer>
  );
};

export default Footer;
