import { NavLink, Outlet } from "react-router-dom";
import React, { useEffect, useState } from 'react';

export default function PageLayout({ refs }) {
    const { homeRef, aboutRef, resumeRef, dissertRef } = refs;
    const [activeRef, setActiveRef] = useState(homeRef);
  
    const updateActiveSection = () => {
        const scrollY = window.scrollY;
        const sectionRefs = [
          { ref: homeRef, name: 'Home' },
          { ref: aboutRef, name: 'About' },
          { ref: resumeRef, name: 'Resume' },
          { ref: dissertRef, name: 'Dissertation' }
        ];
    
        const closestRef = sectionRefs.reduce((closest, { ref, name }) => {
          if (!ref.current) return closest;
          const offsetTop = ref.current.offsetTop;
          const difference = Math.abs(scrollY - offsetTop);
          if (difference < closest.difference) {
            return { ref, name, difference };
          }
          return closest;
        }, { ref: homeRef, name: 'Home', difference: Infinity });
    
        setActiveRef(closestRef.ref);
      };
  
    useEffect(() => {
      window.addEventListener('scroll', updateActiveSection);
      return () => window.removeEventListener('scroll', updateActiveSection);
    }, []);

    const handleClick = (e, ref) => {
        e.preventDefault();
        ref.current.scrollIntoView({ behavior: "smooth", block: "start"});
      };

    return (
        <React.Fragment>
            <div className="topnav">
                <NavLink
                    to="#home"
                    className={(activeRef === homeRef ? 'focused' : '')}
                    onClick={(e) => handleClick(e, homeRef)}
                >
                    HOME PAGE
                </NavLink>

                <NavLink
                    to="#about"
                    className={activeRef === aboutRef ? 'focused' : ''}
                    onClick={(e) => handleClick(e, aboutRef)}
                >
                    ABOUT ME
                </NavLink>

                <NavLink
                    to="#resume"
                    className={activeRef === resumeRef ? 'focused' : ''}
                    onClick={(e) => handleClick(e, resumeRef)}>
                    RESUME
                </NavLink>

                <NavLink
                    to="#dissertation"
                    className={activeRef === dissertRef ? 'focused' : ''}
                    onClick={(e) => handleClick(e, dissertRef)}>
                    DISSERTATION
                </NavLink>
            </div>

            <br/><br/>
            <div className="centerbox">
                <div className="centeredPage">
                    <Outlet/>
                </div>
            </div>

            <footer>
                Copyright © Toby Tomkinson 2023
            </footer>
        </React.Fragment>
    );
}
