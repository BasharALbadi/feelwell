import "./App.css";
import "bootstrap/dist/css/bootstrap.min.css";

import Header from "./Components/Header";
import Footer from "./Components/Footer";
import { Container } from "reactstrap";

import { Route, BrowserRouter as Router, Routes } from "react-router-dom";
import Home from "./Components/Home";
import Login from "./Components/Login";
import Profile from "./Components/Profile";
import Register from "./Components/Register";
import UsersDashboard from "./Components/UsersDashboard";
import DoctorsDashboard from "./Components/DoctorsDashboard";
import AIChat from "./Components/AIChat";
import Welcome from "./Components/Welcome";
import Appointments from "./Components/Appointments";
import Messages from "./Components/Messages";

const App = () => {
  return (
    <div className="page">
      <Router>
        <Header />
        
        <main className="main">
          <Routes>
            <Route path="/" element={<Welcome />}></Route>
            <Route path="/home" element={<Home />}></Route>
            <Route path="/login" element={<Login />}></Route>
            <Route path="/profile" element={<Profile />}></Route>
            <Route path="/register" element={<Register />}></Route>
            <Route path="/users" element={<UsersDashboard />}></Route>
            <Route path="/doctors" element={<DoctorsDashboard />}></Route>
            <Route path="/chat" element={<AIChat />}></Route>
            <Route path="/appointments" element={<Appointments />}></Route>
            <Route path="/messages" element={<Messages />}></Route>
          </Routes>
        </main>

        <Footer />
      </Router>
    </div>
  );
};

export default App;
