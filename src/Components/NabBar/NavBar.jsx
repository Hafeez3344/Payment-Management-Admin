import React from "react";
import { FaBarsStaggered } from "react-icons/fa6";
import { RiMessageLine } from "react-icons/ri";
import { MdOutlineNotificationsNone } from "react-icons/md";
import { MdOutlineFullscreen } from "react-icons/md";
import { FaRegUser } from "react-icons/fa6";
import { BiLogOut } from "react-icons/bi";
import { LuLogOut } from "react-icons/lu";

const NavBar = ({ setShowSide, showSidebar, fn_logout }) => {
  const fn_controlSidebar = () => {
    setShowSide(!showSidebar);
  };
  return (
    <div
      className={`h-[55px]  flex justify-between transition-all duration-500 ${
        showSidebar ? "pl-0 md:pl-[270px]" : "pl-0"
      }`}
    >
      <div className="flex w-full items-center pl-7">
        {/* <div className="text-[20px]">
          <FaBarsStaggered onClick={fn_controlSidebar} className="cursor-pointer" />
        </div> */}
        <h1 className="text-[25px] font-[500]">Payment Management Admin</h1>

        <div className="flex items-center gap-7 pr-7 ml-auto justify-end">
          <div
            className="text-[#417ef1] cursor-pointer flex items-center gap-2"
            onClick={fn_logout}
          >
            <LuLogOut className="text-[20px]" />Logout
          </div>
        </div>
      </div>
    </div>
  );
};

export default NavBar;
