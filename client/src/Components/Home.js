//import logo from "../Images/logo-t.png";
import Posts from "./Posts";
import SharePost from "./SharePost";
import User from "./User";
import { Container, Row, Col, Card, CardBody, CardTitle, Button } from "reactstrap"; //import the Reactstrap Components

import { useSelector } from "react-redux";
import { useNavigate } from "react-router-dom";
import { useEffect } from "react";

const Home = () => {
  const user = useSelector((state) => state.users.user);
  const navigate = useNavigate();

  useEffect(() => {
    if (!user || !user.email) {
      navigate('/login');
    }
  }, [user, navigate]);

  // Redirect to appropriate dashboard based on user type
  useEffect(() => {
    if (user && user.email) {
      if (user.userType === 'doctor') {
        navigate('/doctors');
      } else {
        navigate('/users');
      }
    }
  }, [user, navigate]);

  return (
    <Container className="py-5">
      <Row className="mb-5">
        <Col className="text-center">
          <h1>Loading your dashboard...</h1>
          <p className="lead">Please wait while we redirect you to the appropriate dashboard.</p>
        </Col>
      </Row>
    </Container>
  );
};

export default Home;
