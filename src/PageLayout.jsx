import { NavLink, Outlet, useLocation } from "react-router-dom";
import React, { useEffect, useState } from 'react';

const SECTIONS = [
  { key: 'home',         label: 'Home' },
  { key: 'about',        label: 'About' },
  { key: 'resume',       label: 'Resume' },
  { key: 'dissertation', label: 'Dissertation' },
];

export default function PageLayout({ refs }) {
    const { homeRef, aboutRef, resumeRef, dissertRef } = refs;
    const refMap = {
      home:         homeRef,
      about:        aboutRef,
      resume:       resumeRef,
      dissertation: dissertRef,
    };

    const [activeKey, setActiveKey] = useState('home');
    const [scrolled, setScrolled]   = useState(false);

    const updateActiveSection = () => {
        const scrollY = window.scrollY;
        setScrolled(scrollY > 20);

        const sections = [
          { key: 'home',         ref: homeRef },
          { key: 'about',        ref: aboutRef },
          { key: 'resume',       ref: resumeRef },
          { key: 'dissertation', ref: dissertRef },
        ];

        const closest = sections.reduce((best, s) => {
          if (!s.ref.current) return best;
          const diff = Math.abs(scrollY - s.ref.current.offsetTop);
          return diff < best.diff ? { key: s.key, diff } : best;
        }, { key: 'home', diff: Infinity });

        setActiveKey(closest.key);
    };

    useEffect(() => {
      window.addEventListener('scroll', updateActiveSection);
      return () => window.removeEventListener('scroll', updateActiveSection);
    }, []);

    const location = useLocation();
    const onHome = location.pathname === '/';

    const handleClick = (e, ref) => {
        e.preventDefault();
        ref.current.scrollIntoView({ behavior: "smooth", block: "start" });
    };

    return (
        <React.Fragment>
            {/* ── Nav ── */}
            <nav className="topnav" style={{
                boxShadow: scrolled ? '0 1px 30px rgba(0,0,0,0.5)' : 'none',
                transition: 'box-shadow 0.3s'
            }}>
                <NavLink
                        to="#home"
                        className={activeKey === 'home' ? 'focused' : ''}
                        onClick={(e) => handleClick(e, homeRef)}
                    >Home</NavLink>

                {onHome && (<>
                    <NavLink
                        to="#about"
                        className={activeKey === 'about' ? 'focused' : ''}
                        onClick={(e) => handleClick(e, aboutRef)}
                    >About</NavLink>

                    <NavLink
                        to="#resume"
                        className={activeKey === 'resume' ? 'focused' : ''}
                        onClick={(e) => handleClick(e, resumeRef)}
                    >Resume</NavLink>

                    <NavLink
                        to="#dissertation"
                        className={activeKey === 'dissertation' ? 'focused' : ''}
                        onClick={(e) => handleClick(e, dissertRef)}
                    >Dissertation</NavLink>
                </>)}
            </nav>

            {/* ── Side chrome (hidden below 1100px via CSS) ── */}
            {onHome && (<>
                <div className="side-line" />
                <div className="side-right-line" />

                {/* Left: vertical section labels with active dot */}
                <div className="side-left">
                    {SECTIONS.map(s => (
                        <span
                            key={s.key}
                            className={`side-label${activeKey === s.key ? ' active' : ''}`}
                            style={{ cursor: 'pointer', pointerEvents: 'all' }}
                            onClick={() => refMap[s.key]?.current?.scrollIntoView({ behavior: 'smooth', block: 'start' })}
                        >
                            {s.label}
                        </span>
                    ))}
                </div>

                {/* Right: dot-grid (rendered via CSS ::after) */}
                <div className="side-right" />
            </>)}

            {/* ── Main content ── */}
            <div className="centerbox">
                <div className="centeredPage">
                    <Outlet />
                </div>
            </div>

            <footer>
                <span>© Toby Tomkinson {new Date().getFullYear()}</span>
            </footer>
        </React.Fragment>
    );
}
