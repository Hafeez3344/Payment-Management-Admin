import React, { useState } from "react";
import { LuLogOut } from "react-icons/lu";
import { BiLogOut } from "react-icons/bi";
import { FaRegUser } from "react-icons/fa6";
import { RiMessageLine } from "react-icons/ri";
import { FaBarsStaggered } from "react-icons/fa6";
import { MdOutlineNotificationsNone } from "react-icons/md";
import { MdOutlineFullscreen, MdFullscreenExit } from "react-icons/md";

const NavBar = ({ setShowSide, showSidebar, fn_logout }) => {
  const [isFullScreen, setIsFullScreen] = useState(false);

  const toggleFullScreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen();
      setIsFullScreen(true);
    } else if (document.exitFullscreen) {
      document.exitFullscreen();
      setIsFullScreen(false);
    }
  };

  const fn_controlSidebar = () => {
    setShowSide(!showSidebar);
  };
  return (
    // navbar start 
    <div
      className={`h-[55px]  flex justify-between transition-all duration-500 ${
        showSidebar ? "pl-0 md:pl-[270px]" : "pl-0"
      }`}
    >
      <div className="flex w-full items-center pl-7">
        {/* <div className="text-[20px]">
          <FaBarsStaggered onClick={fn_controlSidebar} className="cursor-pointer" />
        </div> */}
        <h1 className="text-[20px] font-[600]">Payment Management Admin</h1>

        <div className="flex items-center gap-7 pr-7 ml-auto justify-end">
          <div
            className="text-black text-[26px] cursor-pointer"
            onClick={toggleFullScreen}
          >
            {isFullScreen ? <MdFullscreenExit /> : <MdOutlineFullscreen />}
          </div>
          <div
            className="bg-black text-white text-[15px] rounded-md px-2 py-1 cursor-pointer flex items-center gap-2"
            onClick={fn_logout}
          >
            <LuLogOut className="text-[16px]" />
            Logout
          </div>
        </div>
      </div>
    </div>
  );
};

export default NavBar;
