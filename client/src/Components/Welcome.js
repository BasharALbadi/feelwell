import React from "react";
import { Container, Row, Col, Button } from "reactstrap";
import { Link } from "react-router-dom";
import { 
  FaUserMd, FaHospital, FaComments, FaHeartbeat, 
  FaClipboardCheck, FaMobileAlt, FaArrowRight 
} from "react-icons/fa";

const Welcome = () => {
  return (
    <div className="welcome-container">
      {/* Hero Section with Background */}
      <div className="hero-section">
        <div className="hero-overlay"></div>
        <Container>
          <Row className="hero-content">
            <Col lg={6} md={8} className="text-white">
              <h1 className="hero-title">FeelWell Health Portal</h1>
              <p className="hero-subtitle">
                Advanced healthcare solutions for better patient outcomes
              </p>
              <p className="hero-description">
                Experience seamless healthcare management with our comprehensive platform 
                connecting you to qualified professionals and personalized health services.
              </p>
              <div className="hero-buttons">
                <Link to="/register">
                  <Button className="btn-hero-primary">
                    Create Account <FaArrowRight className="ml-2" />
                  </Button>
                </Link>
                <Link to="/login">
                  <Button className="btn-hero-secondary">
                    Sign In
                  </Button>
                </Link>
              </div>
            </Col>
          </Row>
        </Container>
      </div>
      
      {/* Main Features Section */}
      <Container className="features-section">
        <Row className="mb-5">
          <Col className="text-center">
            <h2 className="section-title">Your Health, Our Priority</h2>
            <div className="section-divider"></div>
            <p className="section-description">
              FeelWell provides a comprehensive platform connecting patients with healthcare professionals,
              offering personalized care management, secure access to medical records, and innovative health monitoring tools.
            </p>
          </Col>
        </Row>

        <Row className="welcome-features">
          <Col lg={4} className="mb-4">
            <div className="feature-card">
              <div className="feature-icon">
                <FaUserMd />
              </div>
              <h3 className="feature-title">Expert Healthcare Providers</h3>
              <p>
                Connect with board-certified doctors and specialists who provide comprehensive care tailored to your health needs.
              </p>
              <Link to="/doctors" className="feature-link">Find Doctors <FaArrowRight /></Link>
            </div>
          </Col>
          <Col lg={4} className="mb-4">
            <div className="feature-card">
              <div className="feature-icon">
                <FaHeartbeat />
              </div>
              <h3 className="feature-title">Personalized Health Plans</h3>
              <p>
                Receive customized treatment plans and health recommendations based on your unique medical history and requirements.
              </p>
              <Link to="/register" className="feature-link">Get Started <FaArrowRight /></Link>
            </div>
          </Col>
          <Col lg={4} className="mb-4">
            <div className="feature-card">
              <div className="feature-icon">
                <FaComments />
              </div>
              <h3 className="feature-title">AI-Powered Assistance</h3>
              <p>
                Get instant health guidance and answers to your medical questions through our advanced AI health assistant.
              </p>
              <Link to="/chat" className="feature-link">Try AI Chat <FaArrowRight /></Link>
            </div>
          </Col>
        </Row>

        <Row className="mt-4">
          <Col lg={4} className="mb-4">
            <div className="feature-card">
              <div className="feature-icon">
                <FaClipboardCheck />
              </div>
              <h3 className="feature-title">Electronic Health Records</h3>
              <p>
                Securely access and manage your complete medical history, prescriptions, and test results in one place.
              </p>
              <Link to="/register" className="feature-link">Secure Your Records <FaArrowRight /></Link>
            </div>
          </Col>
          <Col lg={4} className="mb-4">
            <div className="feature-card">
              <div className="feature-icon">
                <FaMobileAlt />
              </div>
              <h3 className="feature-title">Remote Monitoring</h3>
              <p>
                Track your vital signs and health metrics with integrated devices that share data directly with your healthcare team.
              </p>
              <Link to="/register" className="feature-link">Learn More <FaArrowRight /></Link>
            </div>
          </Col>
          <Col lg={4} className="mb-4">
            <div className="feature-card">
              <div className="feature-icon">
                <FaHospital />
              </div>
              <h3 className="feature-title">Facility Locator</h3>
              <p>
                Easily find nearby healthcare facilities, specialists, and emergency services based on your location and needs.
              </p>
              <Link to="/register" className="feature-link">Find Facilities <FaArrowRight /></Link>
            </div>
          </Col>
        </Row>
      </Container>
      
      {/* Testimonial or Call to Action Section */}
      <div className="cta-section">
        <Container>
          <Row>
            <Col lg={8} className="mx-auto text-center">
              <h2 className="cta-title">Ready to take control of your health?</h2>
              <p className="cta-description">
                Join thousands of satisfied users who have transformed their healthcare experience with FeelWell
              </p>
              <Link to="/register">
                <Button className="btn-cta">
                  Get Started Today <FaArrowRight className="ml-2" />
                </Button>
              </Link>
            </Col>
          </Row>
        </Container>
      </div>
    </div>
  );
};

export default Welcome; 