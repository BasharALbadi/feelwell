import {
  Col,
  Container,
  Form,
  Row,
  FormGroup,
  Label,
  Input,
  Button,
  Nav,
  NavItem,
  NavLink,
  Alert
} from "reactstrap";
import { Link, useNavigate } from "react-router-dom";
import { useState, useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import { login } from "../Features/UserSlice";
import { FaUserMd, FaUser, FaEnvelope, FaLock } from 'react-icons/fa';
import loginImage from "../Images/loginImage.jpg";

const Login = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [userType, setUserType] = useState("user"); // "user" or "doctor"
  const [error, setError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const dispatch = useDispatch();
  const navigate = useNavigate();

  //Retrieve the current value of the state from the store, name of state is users with a property user
  const user = useSelector((state) => state.users.user);
  const isSuccess = useSelector((state) => state.users.isSuccess);
  const isError = useSelector((state) => state.users.isError);

  const handleLogin = async (e) => {
    e.preventDefault();
    
    if (!email || !password) {
      setError("Please enter both email and password");
      return;
    }
    
    try {
      setIsSubmitting(true);
      setError("");
      
      const userData = {
        email,
        password,
        userType,
      };
      
      await dispatch(login(userData)).unwrap();
    } catch (err) {
      console.error("Login failed:", err);
      setError("Invalid email or password. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  useEffect(() => {
    if (isError) {
      setError("Login failed. Please check your credentials.");
    }
    
    if (isSuccess && user && user.email) {
      // Redirect based on user type
      if (user.userType === "doctor") {
        navigate("/doctors");
      } else {
        navigate("/users");
      }
    }
  }, [user, isError, isSuccess, navigate]);

  return (
    <Container>
      <Row className="formrow">
        <Col md={6} className="columndiv1">
          <div className="text-center mb-4">
            <h2 className="appTitle">Welcome to FeelWell</h2>
            <p>Please sign in to access your health portal</p>
          </div>
          
          {error && (
            <Alert color="danger" className="mb-4">
              {error}
            </Alert>
          )}
          
          <div className="div-form">
            <div className="user-type-selector d-flex mb-4">
              <div 
                className={`user-type-option flex-grow-1 text-center py-3 ${userType === "user" ? "active" : ""}`}
                onClick={() => setUserType("user")}
                style={{ 
                  borderBottom: userType === "user" ? "3px solid #2c7a7b" : "3px solid transparent",
                  cursor: "pointer",
                  transition: "all 0.3s ease"
                }}
              >
                <FaUser size={20} className="mb-2" />
                <div>Patient</div>
              </div>
              <div 
                className={`user-type-option flex-grow-1 text-center py-3 ${userType === "doctor" ? "active" : ""}`}
                onClick={() => setUserType("doctor")}
                style={{ 
                  borderBottom: userType === "doctor" ? "3px solid #2c7a7b" : "3px solid transparent",
                  cursor: "pointer",
                  transition: "all 0.3s ease"
                }}
              >
                <FaUserMd size={20} className="mb-2" />
                <div>Healthcare Provider</div>
              </div>
            </div>

            <Form onSubmit={handleLogin}>
              <FormGroup>
                <Label for="email">Email Address</Label>
                <div className="input-group mb-3">
                  <div className="input-group-prepend">
                    <span className="input-group-text" style={{ backgroundColor: '#f7fafc' }}>
                      <FaEnvelope />
                    </span>
                  </div>
                  <Input
                    id="email"
                    name="email"
                    placeholder="Enter your email"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                  />
                </div>
              </FormGroup>

              <FormGroup>
                <Label for="password">Password</Label>
                <div className="input-group mb-3">
                  <div className="input-group-prepend">
                    <span className="input-group-text" style={{ backgroundColor: '#f7fafc' }}>
                      <FaLock />
                    </span>
                  </div>
                  <Input
                    id="password"
                    name="password"
                    placeholder="Enter your password"
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                  />
                </div>
              </FormGroup>

              <Button
                color="primary"
                block
                className="button mt-4"
                type="submit"
                disabled={isSubmitting}
                style={{ backgroundColor: '#2c7a7b', border: 'none' }}
              >
                {isSubmitting ? "Signing In..." : "Sign In"}
              </Button>
            </Form>
            
            <div className="text-center mt-3">
              <p>
                Don't have an account? <Link to="/register">Register Now</Link>
              </p>
            </div>
          </div>
        </Col>
        <Col md={6} className="columndiv2 d-none d-md-block">
          <img 
            src={loginImage} 
            alt="Medical Background" 
            className="loginImage" 
          />
        </Col>
      </Row>
    </Container>
  );
};

export default Login;
