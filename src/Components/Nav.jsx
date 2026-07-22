import React from "react";
import { Link } from "react-router-dom";
import Library from "../Pages/Library";
import { NavLink } from "react-router-dom";

const Nav = () => {
  return (
    <div>
      <nav className="flex justify-between px-[17px] py-[10px]  text-[12px] fixed w-full bottom-0 bg-white ">
        <NavLink
          to={"/home"}
          className={({ isActive }) =>
            isActive
              ? "bg-primary/50 rounded-[10px] py-2 w-[53px] text-primary stroke-primary flex justify-center transition-colors duration-300"
              : "bg-transparent rounded-[10px] py-2 w-[53px] text-[#737373] stroke-[#737373] flex justify-center transition-colors duration-300 "
          }
        >
          <span className="flex flex-col items-center">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="24"
              height="24"
              viewBox="0 0 24 24"
              fill="none"
            >
              <path
                d="M3 9L12 2L21 9V20C21 20.5304 20.7893 21.0391 20.4142 21.4142C20.0391 21.7893 19.5304 22 19 22H5C4.46957 22 3.96086 21.7893 3.58579 21.4142C3.21071 21.0391 3 20.5304 3 20V9Z"
                stroke-width="2"
                stroke-linecap="round"
                stroke-linejoin="round"
              />
              <path
                d="M9 22V12H15V22"
                stroke-width="2"
                stroke-linecap="round"
                stroke-linejoin="round"
              />
            </svg>
            <p>Home</p>
          </span>
        </NavLink>

        <NavLink
          to={"/library"}
          className={({ isActive }) =>
            isActive
              ? "bg-primary/50 rounded-[10px] py-2 w-[53px] text-primary stroke-primary flex justify-center transition-colors duration-300"
              : "bg-transparent rounded-[10px] py-2 w-[53px] text-[#737373] stroke-[#737373] flex justify-center transition-colors duration-300"
          }
        >
          <span className="flex flex-col items-center">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="24"
              height="24"
              viewBox="0 0 24 24"
              fill="none"
            >
              <path
                d="M16 6L20 20M12 6V20M8 8V20M4 4V20"
                stroke-width="2"
                stroke-linecap="round"
                stroke-linejoin="round"
              />
            </svg>
            <p>Library</p>
          </span>
        </NavLink>

        <NavLink
          to={"/notes"}
          className={({ isActive }) =>
            isActive
              ? "bg-primary/50 rounded-[10px] py-2 w-[53px] text-primary stroke-primary flex justify-center transition-colors duration-300"
              : "bg-transparent rounded-[10px] py-2 w-[53px] text-[#737373] stroke-[#737373] flex justify-center transition-colors duration-300"
          }
        >
          <span className="flex flex-col items-center">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="24"
              height="24"
              viewBox="0 0 24 24"
              fill="none"
            >
              <path
                d="M9 11L3 17V20H12L15 17"
                stroke-width="2"
                stroke-linecap="round"
                stroke-linejoin="round"
              />
              <path
                d="M21.9998 12L17.3998 16.6C17.026 16.9665 16.5233 17.1717 15.9998 17.1717C15.4763 17.1717 14.9737 16.9665 14.5998 16.6L9.39984 11.4C9.03339 11.0261 8.82812 10.5235 8.82812 10C8.82812 9.47649 9.03339 8.97386 9.39984 8.6L13.9998 4"
                stroke-width="2"
                stroke-linecap="round"
                stroke-linejoin="round"
              />
            </svg>
            <p>Notes</p>
          </span>
        </NavLink>

        <NavLink
          to={"/explore"}
          className={({ isActive }) =>
            isActive
              ? "bg-primary/50 rounded-[10px] py-2 w-[53px] text-primary stroke-primary flex justify-center transition-colors duration-300 "
              : "bg-transparent rounded-[10px] py-2 w-[53px] text-[#737373] stroke-[#737373] flex justify-center transition-colors duration-300"
          }
        >
          <span className="flex flex-col items-center">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="24"
              height="24"
              viewBox="0 0 24 24"
              fill="none"
            >
              <path d="M12 13C11.7167 13 11.4792 12.9042 11.2875 12.7125C11.0958 12.5208 11 12.2833 11 12C11 11.7167 11.0958 11.4792 11.2875 11.2875C11.4792 11.0958 11.7167 11 12 11C12.2833 11 12.5208 11.0958 12.7125 11.2875C12.9042 11.4792 13 11.7167 13 12C13 12.2833 12.9042 12.5208 12.7125 12.7125C12.5208 12.9042 12.2833 13 12 13ZM12 22C10.6167 22 9.31667 21.7375 8.1 21.2125C6.88333 20.6875 5.825 19.975 4.925 19.075C4.025 18.175 3.3125 17.1167 2.7875 15.9C2.2625 14.6833 2 13.3833 2 12C2 10.6167 2.2625 9.31667 2.7875 8.1C3.3125 6.88333 4.025 5.825 4.925 4.925C5.825 4.025 6.88333 3.3125 8.1 2.7875C9.31667 2.2625 10.6167 2 12 2C13.3833 2 14.6833 2.2625 15.9 2.7875C17.1167 3.3125 18.175 4.025 19.075 4.925C19.975 5.825 20.6875 6.88333 21.2125 8.1C21.7375 9.31667 22 10.6167 22 12C22 13.3833 21.7375 14.6833 21.2125 15.9C20.6875 17.1167 19.975 18.175 19.075 19.075C18.175 19.975 17.1167 20.6875 15.9 21.2125C14.6833 21.7375 13.3833 22 12 22ZM12 20C14.2333 20 16.125 19.225 17.675 17.675C19.225 16.125 20 14.2333 20 12C20 9.76667 19.225 7.875 17.675 6.325C16.125 4.775 14.2333 4 12 4C9.76667 4 7.875 4.775 6.325 6.325C4.775 7.875 4 9.76667 4 12C4 14.2333 4.775 16.125 6.325 17.675C7.875 19.225 9.76667 20 12 20ZM7.425 17.075L13.675 14.15C13.775 14.1 13.8667 14.0333 13.95 13.95C14.0333 13.8667 14.1 13.775 14.15 13.675L17.075 7.425C17.1583 7.25833 17.1375 7.1125 17.0125 6.9875C16.8875 6.8625 16.7417 6.84167 16.575 6.925L10.325 9.85C10.225 9.9 10.1333 9.96667 10.05 10.05C9.96667 10.1333 9.9 10.225 9.85 10.325L6.925 16.575C6.84167 16.7417 6.8625 16.8875 6.9875 17.0125C7.1125 17.1375 7.25833 17.1583 7.425 17.075Z" />
            </svg>
            <p>Explore</p>
          </span>
        </NavLink>

        <NavLink
          to={"/profile"}
          className={({ isActive }) =>
            isActive
              ? "bg-primary/50 rounded-[10px] py-2 w-[53px] text-primary stroke-primary flex justify-center transition-colors duration-300"
              : "bg-transparent rounded-[10px] py-2 w-[53px] text-[#737373] stroke-[#737373] flex justify-center transition-colors duration-300"
          }
        >
          <span className="flex flex-col items-center">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="24"
              height="24"
              viewBox="0 0 24 24"
              fill="none"
            >
              <path
                d="M4 18C4 16.9391 4.42143 15.9217 5.17157 15.1716C5.92172 14.4214 6.93913 14 8 14H16C17.0609 14 18.0783 14.4214 18.8284 15.1716C19.5786 15.9217 20 16.9391 20 18C20 18.5304 19.7893 19.0391 19.4142 19.4142C19.0391 19.7893 18.5304 20 18 20H6C5.46957 20 4.96086 19.7893 4.58579 19.4142C4.21071 19.0391 4 18.5304 4 18Z"
                stroke-width="1.5"
                stroke-linejoin="round"
              />
              <path
                d="M12 10C13.6569 10 15 8.65685 15 7C15 5.34315 13.6569 4 12 4C10.3431 4 9 5.34315 9 7C9 8.65685 10.3431 10 12 10Z"
                stroke-width="1.5"
              />
            </svg>
            <p>Profile</p>
          </span>
        </NavLink>
      </nav>
    </div>
  );
};

export default Nav;
