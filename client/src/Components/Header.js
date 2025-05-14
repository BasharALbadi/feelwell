import React, { useState, useEffect } from 'react';
import { Nav, NavItem, NavLink, Container, Collapse, Navbar, NavbarToggler } from "reactstrap";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { useSelector, useDispatch } from "react-redux";
import { logout } from "../Features/UserSlice";
import { FaUserMd, FaHospital, FaUser, FaSignOutAlt, FaHome, FaComment, FaBars } from 'react-icons/fa';
import { motion } from 'framer-motion';

const Header = () => {
  const user = useSelector((state) => state.users.user);
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const location = useLocation();
  const [isOpen, setIsOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  const toggle = () => setIsOpen(!isOpen);

  useEffect(() => {
    const handleScroll = () => {
      const isScrolled = window.scrollY > 10;
      if (isScrolled !== scrolled) {
        setScrolled(isScrolled);
      }
    };

    window.addEventListener('scroll', handleScroll);
    return () => {
      window.removeEventListener('scroll', handleScroll);
    };
  }, [scrolled]);

  const handleLogout = () => {
    // Despachar la acción de logout para limpiar el estado de Redux
    dispatch(logout());
    
    // Limpiar completamente el localStorage 
    localStorage.clear();
    
    // Redireccionar a la página principal y forzar una recarga completa
    navigate("/");
    
    // Forzar recarga completa de la página después de un breve retraso
    setTimeout(() => {
      window.location.reload();
    }, 100);
  };

  const isActive = (path) => {
    return location.pathname === path ? "active" : "";
  };

  const renderAuthLinks = () => {
    if (user && user.email) {
      // User is logged in
      return (
        <>
          {user.userType === 'doctor' ? (
            <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
              <NavItem>
                <NavLink tag={Link} to="/doctors" className={`nav-link ${isActive("/doctors")}`}>
                  <FaHospital className="me-1" /> Dashboard
                </NavLink>
              </NavItem>
            </motion.div>
          ) : (
            <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
              <NavItem>
                <NavLink tag={Link} to="/users" className={`nav-link ${isActive("/users")}`}>
                  <FaUser className="me-1" /> Dashboard
                </NavLink>
              </NavItem>
            </motion.div>
          )}

          <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
            <NavItem>
              <NavLink tag={Link} to="/chat" className={`nav-link ${isActive("/chat")}`}>
                <FaComment className="me-1" /> AI Chat
              </NavLink>
            </NavItem>
          </motion.div>

          <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
            <NavItem>
              <NavLink tag={Link} to="/profile" className={`nav-link ${isActive("/profile")}`}>
                <FaUser className="me-1" /> Profile
              </NavLink>
            </NavItem>
          </motion.div>

          <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
            <NavItem>
              <NavLink onClick={handleLogout} className="nav-link" style={{ cursor: 'pointer' }}>
                <FaSignOutAlt className="me-1" /> Logout
              </NavLink>
            </NavItem>
          </motion.div>

          <NavItem className="ms-3 userName">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.5 }}
              className="user-welcome"
            >
              {user.name}
            </motion.div>
          </NavItem>
        </>
      );
    } else {
      // User is not logged in
      return (
        <>
          <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
            <NavItem>
              <NavLink tag={Link} to="/" className={`nav-link ${isActive("/")}`}>
                <FaHome className="me-1" /> Home
              </NavLink>
            </NavItem>
          </motion.div>
          
          <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
            <NavItem>
              <NavLink tag={Link} to="/login" className={`nav-link ${isActive("/login")}`}>
                Login
              </NavLink>
            </NavItem>
          </motion.div>
          
          <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
            <NavItem>
              <NavLink tag={Link} to="/register" className={`nav-link ${isActive("/register")}`}>
                Register
              </NavLink>
            </NavItem>
          </motion.div>
        </>
      );
    }
  };

  return (
    <div className={`header ${scrolled ? 'header-scrolled' : ''}`}>
      <Container>
        <Navbar expand="md" light className="py-2">
          <Link to="/" className="d-flex align-items-center brand-container">
            <motion.div
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ duration: 0.5 }}
              className="logo-container"
            >
              <motion.div 
                whileHover={{ rotate: 5 }}
                className="logo-icon"
              >
                <FaUserMd size={32} className="me-2" />
              </motion.div>
              <div className="brand-text">
                <span className="brand-name">MedConnect</span>
                <span className="brand-tagline">Health Portal</span>
              </div>
            </motion.div>
          </Link>
          
          <NavbarToggler onClick={toggle} className="menu-toggler">
            <FaBars />
          </NavbarToggler>
          
          <Collapse isOpen={isOpen} navbar className="justify-content-end">
            <Nav className="ml-auto nav-links" navbar>
              {renderAuthLinks()}
            </Nav>
          </Collapse>
        </Navbar>
      </Container>
    </div>
  );
};

export default Header;
