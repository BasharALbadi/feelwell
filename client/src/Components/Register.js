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
  Alert
} from "reactstrap";
import { userSchemaValidation } from "../Validations/UserValidations";
import { useForm } from "react-hook-form";
import { yupResolver } from "@hookform/resolvers/yup";
import { useDispatch } from "react-redux";
import { useState } from "react";
import { registerUser } from "../Features/UserSlice";
import { useNavigate, Link } from "react-router-dom";

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
    watch
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
      experience: ""
    }
  });

  const dispatch = useDispatch();
  const navigate = useNavigate();

  const onSubmit = async (data) => {
    try {
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

  return (
    <Container className="py-5">
      <Row className="justify-content-center">
        <Col md={6}>
          <Card className="shadow">
            <CardBody>
              <h2 className="text-center mb-4">Register</h2>
              
              {error && (
                <Alert color="danger" className="mb-4">
                  {error}
                </Alert>
              )}
              
              <Nav tabs className="mb-4">
                <NavItem className="w-50 text-center">
                  <NavLink
                    className={userType === "user" ? "active" : ""}
                    onClick={() => setUserType("user")}
                    style={{ cursor: "pointer" }}
                  >
                    User
                  </NavLink>
                </NavItem>
                <NavItem className="w-50 text-center">
                  <NavLink
                    className={userType === "doctor" ? "active" : ""}
                    onClick={() => setUserType("doctor")}
                    style={{ cursor: "pointer" }}
                  >
                    Doctor
                  </NavLink>
                </NavItem>
              </Nav>

              <form onSubmit={handleSubmit(onSubmit)} noValidate>
                <FormGroup>
                  <Label for="name">Full Name</Label>
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
                  {errors.name && (
                    <span className="text-danger small">{errors.name.message}</span>
                  )}
                </FormGroup>

                <FormGroup>
                  <Label for="email">Email</Label>
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
                  {errors.email && (
                    <span className="text-danger small">{errors.email.message}</span>
                  )}
                </FormGroup>

                <FormGroup>
                  <Label for="password">Password</Label>
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
                  {errors.password && (
                    <span className="text-danger small">{errors.password.message}</span>
                  )}
                </FormGroup>

                <FormGroup>
                  <Label for="confirmPassword">Confirm Password</Label>
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
                  {errors.confirmPassword && (
                    <span className="text-danger small">{errors.confirmPassword.message}</span>
                  )}
                </FormGroup>

                {userType === "doctor" && (
                  <>
                    <FormGroup>
                      <Label for="specialization">Specialization</Label>
                      <Input
                        type="text"
                        id="specialization"
                        placeholder="E.g., Clinical Psychology, Psychiatry"
                        {...register("specialization", {
                          onChange: () => {
                            if (touchedFields.specialization) {
                              trigger("specialization");
                            }
                          }
                        })}
                        invalid={errors.specialization ? true : false}
                      />
                      {errors.specialization && (
                        <span className="text-danger small">{errors.specialization.message}</span>
                      )}
                    </FormGroup>

                    <FormGroup>
                      <Label for="experience">Years of Experience</Label>
                      <Input
                        type="number"
                        id="experience"
                        placeholder="Years of professional experience"
                        {...register("experience", {
                          onChange: () => {
                            if (touchedFields.experience) {
                              trigger("experience");
                            }
                          }
                        })}
                        invalid={errors.experience ? true : false}
                      />
                      {errors.experience && (
                        <span className="text-danger small">{errors.experience.message}</span>
                      )}
                    </FormGroup>
                  </>
                )}

                <Button 
                  color="primary" 
                  type="submit" 
                  block 
                  className="mt-4"
                  disabled={isSubmitting}
                >
                  {isSubmitting ? "Registering..." : "Register"}
                </Button>
              </form>
              
              <div className="text-center mt-3">
                <p>
                  Already have an account? <Link to="/login">Sign In</Link>
                </p>
              </div>
            </CardBody>
          </Card>
        </Col>
      </Row>
    </Container>
  );
};

export default Register;
