import { 
  Container, 
  Row, 
  Col, 
  Button, 
  Card, 
  CardBody,
  Nav,
  NavItem,
  NavLink,
  FormGroup,
  Label,
  Input,
  Alert,
  Badge
} from "reactstrap";
import { userSchemaValidation } from "../Validations/UserValidations";
import { useForm } from "react-hook-form";
import { yupResolver } from "@hookform/resolvers/yup";
import { useDispatch } from "react-redux";
import { useState, useEffect } from "react";
import { registerUser } from "../Features/UserSlice";
import { useNavigate, Link } from "react-router-dom";
import { FaUser, FaUserMd, FaEnvelope, FaLock, FaUserTag, FaClock, FaCheck } from 'react-icons/fa';
import { motion } from 'framer-motion';
import loginImage from "../Images/loginImage.jpg";

const Register = () => {
  const [userType, setUserType] = useState("user");
  const [error, setError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  const {
    register,
    handleSubmit,
    formState: { errors, isDirty, isValid, touchedFields },
    reset,
    trigger,
    getValues,
    setValue,
    watch,
    clearErrors,
    setError: setFormError
  } = useForm({
    resolver: yupResolver(userSchemaValidation),
    mode: "onChange",
    reValidateMode: "onChange",
    defaultValues: {
      name: "",
      email: "",
      password: "",
      confirmPassword: "",
      specialization: "",
      experience: "",
      consentToDataAccess: false
    }
  });
  
  // Watch the consent field value
  const consentToDataAccess = watch("consentToDataAccess");

  // Clear the consent error when the checkbox is checked
  useEffect(() => {
    if (consentToDataAccess) {
      clearErrors("consentToDataAccess");
    }
  }, [consentToDataAccess, clearErrors]);

  const dispatch = useDispatch();
  const navigate = useNavigate();

  const onSubmit = async (data) => {
    try {
      // Add an extra validation check for the consent
      if (!data.consentToDataAccess) {
        setFormError("consentToDataAccess", {
          type: "manual",
          message: "You must agree to allow doctors to view your conversations"
        });
        return;
      }
      
      setIsSubmitting(true);
      setError("");
      
      // Trim whitespace from string inputs
      const cleanData = {
        ...data,
        name: data.name.trim(),
        email: data.email.trim()
      };
      
      const userData = {
        name: cleanData.name,
        email: cleanData.email,
        password: cleanData.password,
        userType: userType,
        consentToDataAccess: cleanData.consentToDataAccess,
        ...(userType === "doctor" && {
          specialization: cleanData.specialization,
          experience: cleanData.experience
        })
      };

      console.log("Submitting user data:", userData);
      
      const result = await dispatch(registerUser(userData)).unwrap();
      
      if (result) {
        reset();
        navigate("/login");
      } else {
        setError("Registration failed. Please try again.");
      }
    } catch (error) {
      console.log("Error during registration:", error);
      setError(error.message || "Registration failed. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  // Function to handle checkbox change directly
  const handleConsentChange = (e) => {
    const isChecked = e.target.checked;
    setValue("consentToDataAccess", isChecked, { 
      shouldValidate: true,
      shouldDirty: true,
      shouldTouch: true
    });
    
    if (isChecked) {
      clearErrors("consentToDataAccess");
    }
  };

  return (
    <Container className="py-5">
      <Row className="formrow">
        <Col md={6} className="columndiv1">
          <div className="text-center mb-4">
            <motion.h2 
              className="appTitle"
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
            >
              Register with FeelWell
            </motion.h2>
            <p className="lead">Create a new account to access our health services</p>
            <div className="registration-benefits mt-3 mb-4">
              <Badge color="info" pill className="me-2 p-2">Personal Health Dashboard</Badge>
              <Badge color="info" pill className="me-2 p-2">Doctor Consultations</Badge>
              <Badge color="info" pill className="me-2 p-2">AI Health Assistant</Badge>
            </div>
          </div>
          
          {error && (
            <Alert color="danger" className="mb-4">
              {error}
            </Alert>
          )}
          
          <div className="div-form shadow-sm">
            <div className="form-header p-3 mb-4 text-white" style={{ 
              backgroundColor: '#2c7a7b', 
              borderTopLeftRadius: '16px', 
              borderTopRightRadius: '16px',
              marginTop: '-2rem',
              marginLeft: '-2rem',
              marginRight: '-2rem'
            }}>
              <h4 className="mb-0">Create Your Account</h4>
              <small>All fields are required</small>
            </div>

            <form onSubmit={handleSubmit(onSubmit)} noValidate>
              <FormGroup>
                <Label for="name">Full Name</Label>
                <div className="input-group mb-3">
                  <div className="input-group-prepend">
                    <span className="input-group-text" style={{ backgroundColor: '#f7fafc' }}>
                      <FaUser />
                    </span>
                  </div>
                  <Input
                    type="text"
                    id="name"
                    placeholder="Enter your full name" 
                    {...register("name")}
                    onChange={(e) => {
                      const value = e.target.value;
                      setValue("name", value, { 
                        shouldValidate: true,
                        shouldDirty: true,
                        shouldTouch: true
                      });
                    }}
                    invalid={errors.name ? true : false}
                  />
                </div>
                {errors.name && (
                  <span className="text-danger small">{errors.name.message}</span>
                )}
              </FormGroup>

              <FormGroup>
                <Label for="email">Email</Label>
                <div className="input-group mb-3">
                  <div className="input-group-prepend">
                    <span className="input-group-text" style={{ backgroundColor: '#f7fafc' }}>
                      <FaEnvelope />
                    </span>
                  </div>
                  <Input
                    type="email"
                    id="email"
                    placeholder="Enter your email"
                    {...register("email")}
                    onChange={(e) => {
                      const value = e.target.value;
                      setValue("email", value, { 
                        shouldValidate: true,
                        shouldDirty: true,
                        shouldTouch: true
                      });
                    }}
                    invalid={errors.email ? true : false}
                  />
                </div>
                {errors.email && (
                  <span className="text-danger small">{errors.email.message}</span>
                )}
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
                    type="password"
                    id="password"
                    placeholder="Create a password"
                    {...register("password")}
                    onChange={(e) => {
                      const value = e.target.value;
                      setValue("password", value, { 
                        shouldValidate: true,
                        shouldDirty: true,
                        shouldTouch: true
                      });
                      // If confirm password has a value, validate it as well
                      if (getValues("confirmPassword")) {
                        trigger("confirmPassword");
                      }
                    }}
                    invalid={errors.password ? true : false}
                  />
                </div>
                {errors.password && (
                  <span className="text-danger small">{errors.password.message}</span>
                )}
              </FormGroup>

              <FormGroup>
                <Label for="confirmPassword">Confirm Password</Label>
                <div className="input-group mb-3">
                  <div className="input-group-prepend">
                    <span className="input-group-text" style={{ backgroundColor: '#f7fafc' }}>
                      <FaLock />
                    </span>
                  </div>
                  <Input
                    type="password"
                    id="confirmPassword"
                    placeholder="Confirm your password"
                    {...register("confirmPassword")}
                    onChange={(e) => {
                      const value = e.target.value;
                      setValue("confirmPassword", value, { 
                        shouldValidate: true,
                        shouldDirty: true,
                        shouldTouch: true
                      });
                    }}
                    invalid={errors.confirmPassword ? true : false}
                  />
                </div>
                {errors.confirmPassword && (
                  <span className="text-danger small">{errors.confirmPassword.message}</span>
                )}
              </FormGroup>

              {/* Improve consent checkbox design */}
              <FormGroup className="mb-4">
                <div className="consent-checkbox p-3" style={{ 
                  border: errors.consentToDataAccess ? '1px solid #e53e3e' : '1px solid #e2e8f0', 
                  borderRadius: '8px', 
                  backgroundColor: errors.consentToDataAccess ? 'rgba(229, 62, 62, 0.05)' : '#f8fafc'
                }}>
                  <div className="d-flex align-items-start">
                    <Input
                      type="checkbox"
                      id="consentToDataAccess"
                      className="form-check-input mt-1"
                      checked={consentToDataAccess}
                      {...register("consentToDataAccess")}
                      onChange={handleConsentChange}
                    />
                    <Label 
                      for="consentToDataAccess" 
                      className="form-check-label ms-2"
                    >
                      <strong>Data Access Consent</strong>
                      <p className="text-muted mb-0 small">
                        I understand and agree that healthcare providers may view conversations between me and the FeelWell health assistant for the purpose of providing better medical care and support.
                      </p>
                    </Label>
                  </div>
                  {errors.consentToDataAccess && (
                    <div className="mt-2 p-2 bg-danger-light" style={{ 
                      borderRadius: '4px', 
                      backgroundColor: 'rgba(229, 62, 62, 0.1)' 
                    }}>
                      <span className="text-danger small">{errors.consentToDataAccess.message}</span>
                    </div>
                  )}
                </div>
              </FormGroup>

              <motion.div
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
              >
                <Button 
                  color="primary" 
                  type="submit" 
                  block 
                  className="button mt-4 p-3"
                  disabled={isSubmitting || (userType === "user" && !consentToDataAccess)}
                  style={{ 
                    backgroundColor: '#2c7a7b', 
                    border: 'none',
                    fontSize: '1.1rem',
                    fontWeight: 'bold' 
                  }}
                >
                  {isSubmitting ? (
                    <>
                      <span className="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>
                      Registering...
                    </>
                  ) : (
                    <>
                      <FaCheck className="me-2" /> Register Now
                    </>
                  )}
                </Button>
              </motion.div>
              
              <div className="text-center mt-3">
                <p>
                  Already have an account? <Link to="/login">Sign In</Link>
                </p>
              </div>
            </form>
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

export default Register;
