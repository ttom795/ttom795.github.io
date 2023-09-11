import { NavLink, Outlet } from "react-router-dom"
import React from "react"

export default function PageLayout(){
    return(<React.Fragment>
        <div className="topnav">

        <NavLink
        to="/home"
        className={({ isActive, isPending }) =>
            isPending ? "pending" : isActive ? "active" : ""
        }>HOME PAGE</NavLink>
        
        <NavLink
        to="/about"
        className={({ isActive, isPending }) =>
            isPending ? "pending" : isActive ? "active" : ""
        }>ABOUT ME</NavLink>

        <NavLink
        to="/contact"
        className={({ isActive, isPending }) =>
            isPending ? "pending" : isActive ? "active" : ""
        }>CONTACT</NavLink>
    
        <NavLink
        to="/resume"
        className={({ isActive, isPending }) =>
            isPending ? "pending" : isActive ? "active" : ""
        }>RESUME & DISSERTATION</NavLink>
        
        </div>
        <br/><br/>
        <div className="centerbox">
            <div className="centeredPage">
                <Outlet />
            </div>
        </div>

        <footer>
        Copyright © Toby Tomkinson 2023
        </footer>
        </React.Fragment>)
}