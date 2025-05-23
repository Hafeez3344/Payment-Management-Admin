import React, { useState } from "react";
import { Routes, Route, useNavigate } from "react-router-dom";
import Cookies from "js-cookie";
import Home from "./Components/Home/Home";
import NavBar from "./Components/NabBar/NavBar";
import Footer from "./Components/Footer/Footer";
import SideBar from "./Components/Sidebar/SideBar";
import Login from "./Pages/Admin-Login/AdminLogin";

function App() {
  const navigate = useNavigate();

  const [authorization, setAuthorization] = useState(
    Cookies.get("adminId") ? true : false
  );
  // const [showSidebar, setShowSide] = useState(window.innerWidth > 760 ? true : false);
  const [showSidebar, setShowSide] = useState(false);

  const fn_logout = () => {
    Cookies.remove("adminId");
    Cookies.remove("token");
    Cookies.remove("type");
    localStorage.removeItem("permissions");
    setAuthorization(false);
    navigate("/login");
  };

  return (
    <>
      {authorization && (
        <SideBar showSidebar={showSidebar} setShowSide={setShowSide} setAuthorization={setAuthorization} />
      )}
      <div className="min-h-[100vh]">
        {authorization && (
          <NavBar showSidebar={showSidebar} setShowSide={setShowSide} fn_logout={fn_logout} />
        )}
        <Routes>
          <Route
            path="/login"
            element={
              <Login
                authorization={authorization}
                setAuthorization={setAuthorization}
              />
            }
          />
          <Route
            path="/"
            element={
              <Home authorization={authorization} showSidebar={showSidebar} />
            }
          />
        </Routes>
        {authorization && <Footer />}
      </div>
    </>
  );
}

export default App;
