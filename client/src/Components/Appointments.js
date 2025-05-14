import React, { useState, useEffect } from 'react';
import { Container, Row, Col, Card, CardBody, CardTitle, Table, Badge, Button, Nav, NavItem, NavLink } from 'reactstrap';
import { useNavigate } from 'react-router-dom';
import { useSelector } from 'react-redux';
import { motion } from 'framer-motion';
import axios from 'axios';
import * as ENV from '../config/env';
import { toast, Toaster } from 'react-hot-toast';
import { 
  FaCalendarCheck, 
  FaRegCalendarAlt, 
  FaCalendarDay,
  FaCalendarTimes,
  FaRegClock,
  FaMapMarkerAlt,
  FaUserMd,
  FaCheckCircle,
  FaTimesCircle,
  FaExchangeAlt
} from 'react-icons/fa';

const Appointments = () => {
  const navigate = useNavigate();
  const user = useSelector((state) => state.users.user);
  const [activeTab, setActiveTab] = useState('upcoming');
  const [appointments, setAppointments] = useState([]);
  const [loading, setLoading] = useState(true);
  
  // Cargar citas desde la API
  const loadAppointments = () => {
    if (user && (user.id || user._id)) {
      const userId = user.id || user._id;
      setLoading(true);
      
      axios.get(`${ENV.SERVER_URL}/appointments?userId=${userId}`)
        .then(response => {
          console.log('Appointments loaded from API:', response.data);
          if (response.data && response.data.appointments) {
            setAppointments(response.data.appointments);
          } else {
            setAppointments([]);
          }
        })
        .catch(error => {
          console.error('Error loading appointments:', error);
          toast.error('Failed to load appointments');
          setAppointments([]);
        })
        .finally(() => {
          setLoading(false);
        });
    }
  };
  
  // Cargar citas cuando el componente se monta o el usuario cambia
  useEffect(() => {
    if (user && (user.id || user._id)) {
      loadAppointments();
    }
  }, [user]);
  
  useEffect(() => {
    // Redirigir si no está conectado
    if (!user || !user.email) {
      navigate('/login');
    }
  }, [user, navigate]);
  
  // Get status badge based on appointment status
  const getStatusBadge = (status) => {
    switch(status) {
      case 'confirmed':
        return <Badge color="success" className="status-badge">Confirmed</Badge>;
      case 'scheduled':
        return <Badge color="info" className="status-badge">Scheduled</Badge>;
      case 'cancelled':
        return <Badge color="danger" className="status-badge">Cancelled</Badge>;
      case 'completed':
        return <Badge color="info" className="status-badge">Completed</Badge>;
      default:
        return <Badge color="secondary" className="status-badge">Unknown</Badge>;
    }
  };
  
  // Filter appointments based on active tab
  const filteredAppointments = () => {
    const today = new Date();
    
    const filtered = appointments.filter(appointment => {
      const appointmentDate = new Date(appointment.date);
      
      if (activeTab === 'upcoming') {
        return appointmentDate >= today && 
               (appointment.status === 'confirmed' || 
                appointment.status === 'scheduled');
      } else if (activeTab === 'past') {
        return appointmentDate < today || appointment.status === 'completed';
      } else if (activeTab === 'cancelled') {
        return appointment.status === 'cancelled';
      }
      
      return true;
    });
    
    console.log('Filtered appointments for tab', activeTab, ':', filtered);
    return filtered;
  };
  
  // Handle appointment cancellation
  const handleCancelAppointment = (id) => {
    if (!id) return;
    
    axios.put(`${ENV.SERVER_URL}/appointments/${id}`, { status: 'cancelled' })
      .then(response => {
        console.log('Appointment cancelled:', response.data);
        toast.success('Appointment cancelled successfully');
        loadAppointments(); // Reload to get updated list
      })
      .catch(error => {
        console.error('Error cancelling appointment:', error);
        toast.error('Failed to cancel appointment');
      });
  };
  
  // Handle appointment rescheduling (redirects to booking page)
  const handleRescheduleAppointment = (id) => {
    // In a real app, you would redirect to booking page with pre-filled data
    alert('Reschedule functionality would redirect to booking page');
  };
  
  // Animation variants
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: { 
      opacity: 1,
      transition: { 
        staggerChildren: 0.1
      } 
    }
  };
  
  const itemVariants = {
    hidden: { y: 20, opacity: 0 },
    visible: { 
      y: 0, 
      opacity: 1,
      transition: { type: 'spring', stiffness: 100 }
    }
  };

  return (
    <Container className="py-4">
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
      >
        <Row className="mb-4 d-flex align-items-center">
          <Col>
            <h2 className="page-title mb-0">
              <FaCalendarCheck className="me-2 text-primary" />
              My Appointments
            </h2>
            <p className="text-muted mt-1">
              Manage your upcoming and past medical appointments
            </p>
          </Col>
          <Col xs="auto">
            <Button 
              color="primary"
              className="d-flex align-items-center"
              onClick={() => navigate('/users')}
            >
              <FaRegCalendarAlt className="me-2" />
              Book New Appointment
            </Button>
          </Col>
        </Row>
        
        <Card className="shadow-sm mb-4">
          <CardBody>
            <Nav tabs className="mb-4 custom-tabs">
              <NavItem>
                <motion.div whileHover={{ y: -2 }} whileTap={{ y: 0 }}>
                  <NavLink
                    className={activeTab === 'upcoming' ? 'active' : ''}
                    onClick={() => setActiveTab('upcoming')}
                  >
                    <FaCalendarDay className="me-2" />
                    Upcoming
                  </NavLink>
                </motion.div>
              </NavItem>
              <NavItem>
                <motion.div whileHover={{ y: -2 }} whileTap={{ y: 0 }}>
                  <NavLink
                    className={activeTab === 'past' ? 'active' : ''}
                    onClick={() => setActiveTab('past')}
                  >
                    <FaRegClock className="me-2" />
                    Past
                  </NavLink>
                </motion.div>
              </NavItem>
              <NavItem>
                <motion.div whileHover={{ y: -2 }} whileTap={{ y: 0 }}>
                  <NavLink
                    className={activeTab === 'cancelled' ? 'active' : ''}
                    onClick={() => setActiveTab('cancelled')}
                  >
                    <FaCalendarTimes className="me-2" />
                    Cancelled
                  </NavLink>
                </motion.div>
              </NavItem>
            </Nav>
            
            {filteredAppointments().length > 0 ? (
              <motion.div
                variants={containerVariants}
                initial="hidden"
                animate="visible"
              >
                <div className="table-responsive">
                  <Table hover className="custom-table">
                    <thead>
                      <tr>
                        <th>Doctor</th>
                        <th>Date</th>
                        <th>Time</th>
                        <th>Type</th>
                        <th>Status</th>
                        <th>Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredAppointments().map((appointment, index) => (
                        <motion.tr 
                          key={appointment._id}
                          variants={itemVariants}
                        >
                          <td className="doctor-name">
                            <div className="d-flex align-items-center">
                              <div className="doctor-icon me-2">
                                <FaUserMd size={18} />
                              </div>
                              {appointment.doctor}
                            </div>
                          </td>
                          <td>{new Date(appointment.date).toLocaleDateString()}</td>
                          <td>{appointment.time}</td>
                          <td>
                            <Badge className="appointment-type-badge">{appointment.type}</Badge>
                          </td>
                          <td>
                            {getStatusBadge(appointment.status)}
                          </td>
                          <td>
                            {(appointment.status === 'confirmed' || 
                              appointment.status === 'scheduled') && (
                              <div className="action-buttons">
                                {activeTab === 'upcoming' && (
                                  <>
                                    <motion.button 
                                      className="btn-action btn-reschedule"
                                      whileHover={{ scale: 1.05 }}
                                      whileTap={{ scale: 0.95 }}
                                      onClick={() => handleRescheduleAppointment(appointment._id)}
                                    >
                                      <FaExchangeAlt size={14} />
                                      <span>Reschedule</span>
                                    </motion.button>
                                    <motion.button 
                                      className="btn-action btn-cancel"
                                      whileHover={{ scale: 1.05 }}
                                      whileTap={{ scale: 0.95 }}
                                      onClick={() => handleCancelAppointment(appointment._id)}
                                    >
                                      <FaTimesCircle size={14} />
                                      <span>Cancel</span>
                                    </motion.button>
                                  </>
                                )}
                              </div>
                            )}
                          </td>
                        </motion.tr>
                      ))}
                    </tbody>
                  </Table>
                </div>
              </motion.div>
            ) : (
              <div className="text-center py-5 empty-state">
                <FaRegCalendarAlt size={48} className="text-muted mb-3" />
                <h4>No {activeTab} appointments</h4>
                {activeTab === 'upcoming' && (
                  <p className="text-muted">
                    You don't have any upcoming appointments. 
                    <br />
                    <Button 
                      color="link" 
                      className="mt-2"
                      onClick={() => navigate('/users')}
                    >
                      Book a new appointment
                    </Button>
                  </p>
                )}
                {activeTab === 'past' && (
                  <p className="text-muted">You don't have any past appointments.</p>
                )}
                {activeTab === 'cancelled' && (
                  <p className="text-muted">You don't have any cancelled appointments.</p>
                )}
              </div>
            )}
          </CardBody>
        </Card>
      </motion.div>
    </Container>
  );
};

export default Appointments; 