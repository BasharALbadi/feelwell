import React, { useState } from 'react';
import { Modal, ModalHeader, ModalBody, ModalFooter, Button, Row, Col, Badge, Form, FormGroup, Label, Input } from 'reactstrap';
import { motion } from 'framer-motion';
import { 
  FaCalendarAlt, 
  FaClock, 
  FaUserMd, 
  FaNotesMedical, 
  FaCheckCircle, 
  FaArrowLeft, 
  FaArrowRight 
} from 'react-icons/fa';
import { useSelector } from 'react-redux';
import axios from 'axios';
import { toast, Toaster } from 'react-hot-toast';
import * as ENV from "../config/env";

const AppointmentModal = ({ isOpen, toggle, doctor }) => {
  const [currentStep, setCurrentStep] = useState(1);
  const [selectedDate, setSelectedDate] = useState("");
  const [selectedTime, setSelectedTime] = useState(null);
  const [appointmentType, setAppointmentType] = useState('');
  const [notes, setNotes] = useState('');
  const [referenceNumber, setReferenceNumber] = useState('');
  const [isSuccessful, setIsSuccessful] = useState(false);
  
  // Get user data at the component level (not inside a function)
  const userData = useSelector(state => state.users.user);

  // Appointment types
  const appointmentTypes = [
    { id: 'consultation', label: 'Consultation', icon: <FaUserMd size={24} /> },
    { id: 'followUp', label: 'Follow-up', icon: <FaNotesMedical size={24} /> },
    { id: 'initialVisit', label: 'Initial Visit', icon: <FaUserMd size={24} /> },
  ];

  // Mock available time slots
  const morningSlots = ['09:00 AM', '10:00 AM', '11:00 AM'];
  const afternoonSlots = ['01:00 PM', '02:00 PM', '03:00 PM'];
  const eveningSlots = ['04:00 PM', '05:00 PM', '06:00 PM'];

  // Función para guardar la cita
  const saveAppointment = () => {
    try {
      const appointment = {
        userId: userData.id || userData._id,
        doctorId: doctor.id || doctor._id,
        patient: userData.name,
        doctor: doctor.name,
        date: selectedDate,
        time: selectedTime,
        type: appointmentType,
        notes: notes || "",
        status: "scheduled"
      };

      // Guardar en la base de datos usando la API
      axios.post(`${ENV.SERVER_URL}/appointments`, appointment)
        .then(response => {
          console.log("Appointment saved successfully:", response.data);
          toast.success("Appointment booked successfully!");
          handleReset();
          setIsSuccessful(true);
        })
        .catch(error => {
          console.error("Error saving appointment:", error);
          toast.error("Failed to book appointment. Please try again.");
        });

    } catch (error) {
      console.error("Error in saveAppointment:", error);
      toast.error("An error occurred. Please try again.");
    }
  };

  // Handle next step
  const handleNext = () => {
    if (currentStep === 3) {
      // Final step - generate reference number and save appointment
      saveAppointment();
    }
    setCurrentStep(currentStep + 1);
  };

  // Handle previous step
  const handlePrevious = () => {
    setCurrentStep(currentStep - 1);
  };

  // Reset the form when closing
  const handleClose = () => {
    setCurrentStep(1);
    setSelectedDate("");
    setSelectedTime(null);
    setAppointmentType('');
    setNotes('');
    setReferenceNumber('');
    toggle();
  };

  // Check if current step is valid to proceed
  const isStepValid = () => {
    switch (currentStep) {
      case 1:
        return appointmentType !== '';
      case 2:
        return selectedDate !== "" && selectedTime !== null;
      case 3:
        return true; // Notes are optional
      default:
        return false;
    }
  };

  // Format date for display
  const formatDate = (dateString) => {
    if (!dateString) return "";
    const date = new Date(dateString);
    return date.toDateString();
  };

  // Reset the form
  const handleReset = () => {
    setCurrentStep(1);
    setSelectedDate("");
    setSelectedTime(null);
    setAppointmentType('');
    setNotes('');
    setReferenceNumber('');
    setIsSuccessful(false);
  };

  return (
    <Modal isOpen={isOpen} toggle={handleClose} className="appointment-modal" size="lg">
      <ModalHeader toggle={handleClose}>
        {currentStep < 4 ? 'Book Appointment' : 'Appointment Confirmed'}
      </ModalHeader>
      
      <ModalBody>
        {currentStep < 4 && (
          <div className="step-indicators mb-4">
            {[1, 2, 3].map((step) => (
              <div className="step-indicator" key={step}>
                <div 
                  className={`step-number ${currentStep >= step ? 'active' : ''}`}
                  style={{
                    width: '30px',
                    height: '30px',
                    borderRadius: '50%',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    backgroundColor: currentStep >= step ? '#3182ce' : '#e2e8f0',
                    color: currentStep >= step ? 'white' : '#718096',
                    fontWeight: '600',
                    marginBottom: '8px',
                  }}
                >
                  {step}
                </div>
                <div className="step-label" style={{ fontSize: '0.8rem', color: '#718096' }}>
                  {step === 1 && 'Type'}
                  {step === 2 && 'Schedule'}
                  {step === 3 && 'Details'}
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Step 1: Appointment Type Selection */}
        {currentStep === 1 && (
          <div>
            <h5 className="step-title mb-3">
              <FaUserMd className="me-2" /> Select Appointment Type
            </h5>
            
            <div className="appointment-type-options">
              {appointmentTypes.map((type) => (
                <div 
                  key={type.id}
                  className={`appointment-type-card ${appointmentType === type.id ? 'selected' : ''}`}
                  onClick={() => setAppointmentType(type.id)}
                >
                  <div className="appointment-type-icon">
                    {type.icon}
                  </div>
                  <div className="appointment-type-label">
                    {type.label}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Step 2: Date and Time Selection */}
        {currentStep === 2 && (
          <div>
            <h5 className="step-title mb-3">
              <FaCalendarAlt className="me-2" /> Select Date and Time
            </h5>
            
            <Row>
              <Col md={6}>
                <div className="mb-3">
                  <Label className="mb-2">Select Date</Label>
                  <Input
                    type="date"
                    name="date"
                    id="appointmentDate"
                    value={selectedDate}
                    onChange={(e) => setSelectedDate(e.target.value)}
                    min={new Date().toISOString().split('T')[0]}
                    className="form-control mb-4"
                  />
                </div>
              </Col>
              
              <Col md={6}>
                <div className="time-slots-container">
                  {!selectedDate ? (
                    <div className="select-date-prompt">
                      <FaClock size={32} className="mb-3" />
                      <p>Please select a date first to view available time slots</p>
                    </div>
                  ) : (
                    <>
                      {/* Morning slots */}
                      <div className="time-section">
                        <div className="time-section-title">Morning</div>
                        <div className="time-grid">
                          {morningSlots.map((time) => (
                            <button 
                              key={time}
                              className={`time-slot ${selectedTime === time ? 'selected' : ''}`}
                              onClick={() => setSelectedTime(time)}
                            >
                              {time}
                            </button>
                          ))}
                        </div>
                      </div>
                      
                      {/* Afternoon slots */}
                      <div className="time-section">
                        <div className="time-section-title">Afternoon</div>
                        <div className="time-grid">
                          {afternoonSlots.map((time) => (
                            <button 
                              key={time}
                              className={`time-slot ${selectedTime === time ? 'selected' : ''}`}
                              onClick={() => setSelectedTime(time)}
                            >
                              {time}
                            </button>
                          ))}
                        </div>
                      </div>
                      
                      {/* Evening slots */}
                      <div className="time-section">
                        <div className="time-section-title">Evening</div>
                        <div className="time-grid">
                          {eveningSlots.map((time) => (
                            <button 
                              key={time}
                              className={`time-slot ${selectedTime === time ? 'selected' : ''}`}
                              onClick={() => setSelectedTime(time)}
                            >
                              {time}
                            </button>
                          ))}
                        </div>
                      </div>
                    </>
                  )}
                </div>
              </Col>
            </Row>
          </div>
        )}

        {/* Step 3: Additional Details */}
        {currentStep === 3 && (
          <div>
            <h5 className="step-title mb-3">
              <FaNotesMedical className="me-2" /> Additional Details
            </h5>
            
            <Row>
              <Col md={6}>
                <div className="appointment-summary-card p-3 mb-3">
                  <div className="doctor-info-summary">
                    <div className="doctor-image-wrapper-small">
                      {doctor?.profileImage ? (
                        <img 
                          src={doctor.profileImage} 
                          alt={doctor.name} 
                          className="doctor-image-small"
                        />
                      ) : (
                        <div className="doctor-placeholder-small">
                          <FaUserMd size={32} />
                        </div>
                      )}
                    </div>
                    <h5 className="mb-1">{doctor?.name || 'Dr. Name'}</h5>
                    <p className="text-muted mb-0">{doctor?.specialty || 'Specialty'}</p>
                  </div>
                  
                  <div className="appointment-details-summary mt-3">
                    <div className="detail-item">
                      <div className="detail-label">Type:</div>
                      <div className="detail-value">
                        {appointmentTypes.find(t => t.id === appointmentType)?.label}
                      </div>
                    </div>
                    
                    <div className="detail-item">
                      <div className="detail-label">Date:</div>
                      <div className="detail-value">
                        {formatDate(selectedDate)}
                      </div>
                    </div>
                    
                    <div className="detail-item">
                      <div className="detail-label">Time:</div>
                      <div className="detail-value">{selectedTime}</div>
                    </div>
                  </div>
                </div>
              </Col>
              
              <Col md={6}>
                <FormGroup>
                  <Label for="notes">Notes (Optional)</Label>
                  <Input 
                    type="textarea" 
                    name="notes" 
                    id="notes"
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    placeholder="Describe your reason for visit or any symptoms..."
                    className="appointment-textarea"
                    rows={5}
                  />
                </FormGroup>
              </Col>
            </Row>
          </div>
        )}

        {/* Step 4: Confirmation */}
        {currentStep === 4 && (
          <div className="appointment-success text-center">
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ duration: 0.5 }}
            >
              <div className="success-icon mb-4">
                <FaCheckCircle size={64} color="#48bb78" />
              </div>
            </motion.div>
            
            <h4 className="mb-3">Your Appointment is Confirmed!</h4>
            
            <div className="reference-number mb-4">
              <div className="reference-label">Reference Number:</div>
              <div className="reference-value">{referenceNumber}</div>
            </div>
            
            <div className="appointment-summary-card p-3 mb-4 mx-auto" style={{ maxWidth: '400px' }}>
              <div className="doctor-info-summary">
                <h5 className="mb-1">{doctor?.name || 'Dr. Name'}</h5>
                <p className="text-muted mb-0">{doctor?.specialty || 'Specialty'}</p>
              </div>
              
              <div className="appointment-details-summary mt-3">
                <div className="detail-item">
                  <div className="detail-label">Type:</div>
                  <div className="detail-value">
                    {appointmentTypes.find(t => t.id === appointmentType)?.label}
                  </div>
                </div>
                
                <div className="detail-item">
                  <div className="detail-label">Date:</div>
                  <div className="detail-value">
                    {formatDate(selectedDate)}
                  </div>
                </div>
                
                <div className="detail-item">
                  <div className="detail-label">Time:</div>
                  <div className="detail-value">{selectedTime}</div>
                </div>
              </div>
            </div>
            
            <div className="confirmation-notice">
              <p>A confirmation email has been sent to your registered email address. You can manage or reschedule your appointment from the Appointments section.</p>
            </div>
          </div>
        )}
      </ModalBody>
      
      <ModalFooter>
        {currentStep < 4 ? (
          <>
            {currentStep > 1 && (
              <Button className="btn-back me-2" onClick={handlePrevious}>
                <FaArrowLeft size={12} className="me-1" /> Back
              </Button>
            )}
            
            <Button 
              className={currentStep === 3 ? "btn-confirm" : "btn-next"} 
              onClick={handleNext}
              disabled={!isStepValid()}
            >
              {currentStep === 3 ? (
                <>Confirm Appointment</>
              ) : (
                <>Next <FaArrowRight size={12} className="ms-1" /></>
              )}
            </Button>
          </>
        ) : (
          <Button className="btn-done" onClick={handleClose}>
            Done
          </Button>
        )}
      </ModalFooter>
    </Modal>
  );
};

export default AppointmentModal; 