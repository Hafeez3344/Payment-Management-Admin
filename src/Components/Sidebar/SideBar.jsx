import Cookies from "js-cookie";
import { LuLogOut } from "react-icons/lu";
import React, { useState, useEffect } from "react";
import { MdOutlineDashboard } from "react-icons/md";
import Royal247Logo from "../../assets/Royal247Logo.png"
import { useNavigate, useLocation } from "react-router-dom";
import { PiNotebook } from "react-icons/pi";

const SideBar = ({ showSidebar, setShowSide, setAuthorization }) => {
  const location = useLocation();
  const navigate = useNavigate();
  const isMobile = () => window.innerWidth < 1024;
  const [selectedPage, setSelectedPage] = useState("");

  useEffect(() => {
    const path = location.pathname;
    if (path === "/") setSelectedPage("dashboard");
    else setSelectedPage(path.substring(1));
  }, [location]);

  const fn_controlSidebar = () => {
    setShowSide(!showSidebar);
  };

  const handleMenuClick = (page, path) => {
    setSelectedPage(page);
    navigate(path);
    if (isMobile()) fn_controlSidebar();
  };

  const fn_logout = () => {
    Cookies.remove('adminId');
    Cookies.remove('token');
    setAuthorization(false);
    navigate("/login");
  }

  return (
    <div
      className={`fixed w-[270px] h-[100vh] bg-white border-r transition-all duration-500 ${showSidebar ? "left-0" : "left-[-270px]"
        }`}
      style={{ zIndex: 999 }}
    >
      <div className="flex pl-[21px] h-[55px] items-center gap-3 border-b border-secondary">
        <div>
          {/* <img className="w-[130px]" src={Royal247Logo} alt="" /> */}
          <span className="text-[20px] font-[600]">Management Admin</span>
        </div>
        <button
          className="bg-gray-200 h-[25px] w-[25px] rounded-sm flex md:hidden justify-center ml-20 items-center"
          onClick={fn_controlSidebar}
        >
          X
        </button>
      </div>
      <div className="mt-[10px] mb-[50px] overflow-auto" style={{ height: "calc(100vh - 115px)" }}>
        {/* Dashboard */}
        <Menu
          onClick={() => handleMenuClick("dashboard", "/")}
          label="Dashboard"
          icon={<MdOutlineDashboard className="text-[20px]" />}
          isActive={selectedPage === "dashboard"}
        />
        
        {/* Transactions */}
        {/* <Menu
          onClick={() => handleMenuClick("transactions", "/transactions")}
          label="Transactions"
          icon={<PiNotebook className="text-[20px]" />}
          isActive={selectedPage === "transactions"}
        /> */}
      </div>
      <div
        onClick={fn_logout}
        className="flex border-t gap-[15px] items-center py-[14px] px-[20px] cursor-pointer absolute bottom-0 w-full bg-white"
      >
        <div className="text-[rgba(105,155,247,1)]">
          <LuLogOut className="text-[20px] rotate-180" />
        </div>
        <p className="text-[14px] font-[600] text-gray-500">Logout</p>
      </div>
    </div>
  );
};

export default SideBar;

const Menu = ({ label, icon, onClick, isActive }) => {
  return (
    <div
      className={`flex border-b gap-[15px] items-center py-[14px] px-[20px] cursor-pointer ${isActive ? "bg-blue-50" : ""
        }`}
      onClick={onClick}
    >
      <div className="text-[rgba(105,155,247,1)]">{icon}</div>
      <p className="text-[14px] font-[600] text-gray-500">{label}</p>
    </div>
  );
};

