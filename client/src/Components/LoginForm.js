import React, { useState, useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useNavigate } from "react-router-dom";
import { login, clearErrors } from "../Features/UserSlice";
import { Form, Label, Input, FormGroup, Col, Row, Button, Alert } from "reactstrap";
import { motion } from "framer-motion";
import { FaUserMd, FaUser } from 'react-icons/fa';

const LoginForm = () => {
  const [userEmail, setUserEmail] = useState("");
  const [userPassword, setUserPassword] = useState("");
  const [userType, setUserType] = useState("user");
  const [loginStatus, setLoginStatus] = useState("");
  
  const dispatch = useDispatch();
  const navigate = useNavigate();
  
  const { user, isLoading, isError, errorMessage } = useSelector(
    (state) => state.users
  );

  useEffect(() => {
    // Si hay un error, mostrar mensaje durante 4 segundos y luego limpiar
    if (isError) {
      setLoginStatus(`Error: ${errorMessage}`);
      const timer = setTimeout(() => {
        dispatch(clearErrors());
        setLoginStatus("");
      }, 4000);
      return () => clearTimeout(timer);
    }
    
    // Si el login fue exitoso, redireccionar según el tipo de usuario
    if (user && user.email) {
      setLoginStatus("Login successful!");
      
      // Redireccionar basado en el tipo de usuario
      setTimeout(() => {
        if (user.userType === "doctor") {
          navigate("/doctors");
        } else {
          navigate("/users");
        }
      }, 500);
    }
  }, [isError, errorMessage, user, navigate, dispatch]);

  const handleSubmit = (e) => {
    e.preventDefault();
    
    if (!userEmail || !userPassword) {
      setLoginStatus("Error: Email and password are required");
      return;
    }
    
    // Limpiar estado previo
    setLoginStatus("Logging in...");
    
    const userData = {
      email: userEmail,
      password: userPassword,
      userType: userType,
    };
    
    dispatch(login(userData));
  };

  return (
    <Form onSubmit={handleSubmit} className="login-form">
      <h2 className="text-center mb-4">Login</h2>
      
      {loginStatus && (
        <Alert color={loginStatus.includes("Error") ? "danger" : (loginStatus === "Logging in..." ? "info" : "success")}>
          {loginStatus}
        </Alert>
      )}
      
      <Row className="mb-4">
        <Col className="text-center">
          <div className="user-type-selector">
            <motion.div
              className={`user-type-option ${userType === 'user' ? 'active' : ''}`}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => setUserType('user')}
            >
              <FaUser size={24} className="mb-2" />
              <span>Patient</span>
            </motion.div>
            
            <motion.div
              className={`user-type-option ${userType === 'doctor' ? 'active' : ''}`}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => setUserType('doctor')}
            >
              <FaUserMd size={24} className="mb-2" />
              <span>Doctor</span>
            </motion.div>
          </div>
        </Col>
      </Row>
      
      <FormGroup className="mb-3">
        <Label for="email">Email</Label>
        <Input
          type="email"
          name="email"
          id="email"
          placeholder="Enter your email"
          value={userEmail}
          onChange={(e) => setUserEmail(e.target.value)}
          required
        />
      </FormGroup>
      
      <FormGroup className="mb-4">
        <Label for="password">Password</Label>
        <Input
          type="password"
          name="password"
          id="password"
          placeholder="Enter your password"
          value={userPassword}
          onChange={(e) => setUserPassword(e.target.value)}
          required
        />
      </FormGroup>
      
      <motion.div
        whileHover={{ scale: 1.02 }}
        whileTap={{ scale: 0.98 }}
      >
        <Button
          color="primary"
          type="submit"
          block
          className="mb-3"
          disabled={isLoading}
        >
          {isLoading ? 'Logging in...' : 'Login'}
        </Button>
      </motion.div>
      
      <div className="text-center mt-3">
        <p className="mb-0">
          Don't have an account?{" "}
          <motion.a 
            whileHover={{ scale: 1.05 }}
            href="/register"
          >
            Register here
          </motion.a>
        </p>
      </div>
    </Form>
  );
};

export default LoginForm; 