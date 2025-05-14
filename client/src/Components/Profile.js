import React, { useState, useEffect } from 'react';
import { Container, Row, Col, Card, CardBody, CardHeader, ListGroup, ListGroupItem, Button, Form, FormGroup, Label, Input } from 'reactstrap';
import { useSelector } from "react-redux";
import { useNavigate } from "react-router-dom";
import user from "../Images/user.png";

const Profile = () => {
  const userData = useSelector((state) => state.users.user);
  const navigate = useNavigate();
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    emergencyContact: '',
    preferences: ''
  });

  useEffect(() => {
    if (!userData || !userData.email) {
      navigate("/login");
    } else {
      setFormData({
        name: userData.name || '',
        email: userData.email || '',
        phone: userData.phone || '',
        emergencyContact: userData.emergencyContact || '',
        preferences: userData.preferences || ''
      });
    }
  }, [userData, navigate]);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    // Here would be the logic to save profile changes to backend
    console.log('Updated profile data:', formData);
    setIsEditing(false);
  };

  const renderDoctorSpecificInfo = () => {
    if (userData && userData.userType === 'doctor') {
      return (
        <Card className="mb-4">
          <CardHeader>Professional Information</CardHeader>
          <CardBody>
            <ListGroup flush>
              <ListGroupItem>
                <strong>Specialization:</strong> {userData.specialization || 'Not specified'}
              </ListGroupItem>
              <ListGroupItem>
                <strong>Experience:</strong> {userData.experience || 'Not specified'} years
              </ListGroupItem>
              <ListGroupItem>
                <strong>License Number:</strong> {userData.licenseNumber || 'Not specified'}
              </ListGroupItem>
            </ListGroup>
          </CardBody>
        </Card>
      );
    }
    return null;
  };

  const renderUserSpecificInfo = () => {
    if (userData && userData.userType !== 'doctor') {
      return (
        <Card className="mb-4">
          <CardHeader>Health Information</CardHeader>
          <CardBody>
            <ListGroup flush>
              <ListGroupItem>
                <strong>Therapy Goals:</strong> {userData.therapyGoals || 'Not specified'}
              </ListGroupItem>
              <ListGroupItem>
                <strong>Assigned Doctor:</strong> {userData.assignedDoctor || 'None'}
              </ListGroupItem>
            </ListGroup>
          </CardBody>
        </Card>
      );
    }
    return null;
  };

  return (
    <Container className="py-5">
      <Row>
        <Col md={4}>
          <Card className="text-center mb-4">
            <CardBody>
              <div className="mb-3">
                <img 
                  src={user} 
                  alt="Profile" 
                  className="rounded-circle img-thumbnail" 
                  style={{ width: '150px', height: '150px', objectFit: 'cover' }}
                />
              </div>
              <h3>{userData?.name || 'User'}</h3>
              <p className="text-muted">{userData?.userType === 'doctor' ? 'Mental Health Professional' : 'Member'}</p>
              {!isEditing && (
                <Button color="primary" onClick={() => setIsEditing(true)}>
                  Edit Profile
                </Button>
              )}
            </CardBody>
          </Card>

          {renderDoctorSpecificInfo()}
          {renderUserSpecificInfo()}
        </Col>

        <Col md={8}>
          <Card>
            <CardHeader>
              <h4>{isEditing ? 'Edit Profile' : 'Profile Information'}</h4>
            </CardHeader>
            <CardBody>
              {isEditing ? (
                <Form onSubmit={handleSubmit}>
                  <FormGroup>
                    <Label for="name">Full Name</Label>
                    <Input
                      type="text"
                      name="name"
                      id="name"
                      value={formData.name}
                      onChange={handleInputChange}
                    />
                  </FormGroup>
                  <FormGroup>
                    <Label for="email">Email</Label>
                    <Input
                      type="email"
                      name="email"
                      id="email"
                      value={formData.email}
                      onChange={handleInputChange}
                      disabled
                    />
                  </FormGroup>
                  <FormGroup>
                    <Label for="phone">Phone Number</Label>
                    <Input
                      type="text"
                      name="phone"
                      id="phone"
                      value={formData.phone}
                      onChange={handleInputChange}
                    />
                  </FormGroup>
                  <FormGroup>
                    <Label for="emergencyContact">Emergency Contact</Label>
                    <Input
                      type="text"
                      name="emergencyContact"
                      id="emergencyContact"
                      value={formData.emergencyContact}
                      onChange={handleInputChange}
                    />
                  </FormGroup>
                  <FormGroup>
                    <Label for="preferences">Communication Preferences</Label>
                    <Input
                      type="select"
                      name="preferences"
                      id="preferences"
                      value={formData.preferences}
                      onChange={handleInputChange}
                    >
                      <option value="">Select preference</option>
                      <option value="email">Email</option>
                      <option value="phone">Phone</option>
                      <option value="text">Text Message</option>
                    </Input>
                  </FormGroup>
                  <div className="d-flex justify-content-end">
                    <Button color="secondary" className="me-2" onClick={() => setIsEditing(false)}>
                      Cancel
                    </Button>
                    <Button color="primary" type="submit">
                      Save Changes
                    </Button>
                  </div>
                </Form>
              ) : (
                <ListGroup flush>
                  <ListGroupItem>
                    <strong>Name:</strong> {userData?.name}
                  </ListGroupItem>
                  <ListGroupItem>
                    <strong>Email:</strong> {userData?.email}
                  </ListGroupItem>
                  <ListGroupItem>
                    <strong>Phone Number:</strong> {userData?.phone || 'Not provided'}
                  </ListGroupItem>
                  <ListGroupItem>
                    <strong>Emergency Contact:</strong> {userData?.emergencyContact || 'Not provided'}
                  </ListGroupItem>
                  <ListGroupItem>
                    <strong>Communication Preference:</strong> {userData?.preferences || 'Not specified'}
                  </ListGroupItem>
                  <ListGroupItem>
                    <strong>Member Since:</strong> {userData?.joinDate || 'Unknown'}
                  </ListGroupItem>
                </ListGroup>
              )}
            </CardBody>
          </Card>
        </Col>
      </Row>
    </Container>
  );
};

export default Profile;
