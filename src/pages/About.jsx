import { useState } from "react";
import React from "react";
import "../timeline.css"
import { Link } from "react-router-dom"

export function ExpandableDiv({ content }){
  const [isExpanded, setExpanded] = useState(false);

  const handleExpandClick = () => {
    setExpanded(!isExpanded);
  };

  const divStyle = {
    height: isExpanded ? '100%' : '0%', // Adjust the height based on the expanded state
    transition: 'height 1s ease', // Smooth transition when height changes
  };

  return (
    <div>
      <button onClick={handleExpandClick}>
        {isExpanded ? 'HIDE SECTION' : 'VIEW SECTION'}
      </button>
      <div style={divStyle}>{isExpanded ? <div className="fade-in-element">{content}</div> : ""}</div>
    </div>
  );
};

export default function About() {
    return(
    <React.Fragment>
      <div className="fade-in-element">
      <h1>About Me</h1>
      <div className="row">
      <div className="column">
      <h2>Personal Projects</h2>
      <div>
            <h3>Hero Academia: Beyond | UE4 | C++</h3>
            <p>In my capacity as a game designer and programmer for "Hero Academia: Beyond," I designed gameplay mechanics, interactive environments, and optimized code to ensure a smooth gaming experience. In addition to this, I also ported the game from desktop to mobile with full gameplay, rendering and post-processing functionality.</p>
            <a href="https://www.heroacademiabeyond.com/">View Project</a>
        </div>

        <div>
            <h3>Chippure | Python</h3>
            <p>Chippure is a Python-based Chip-8 emulator developed using Python's default libraries. It faithfully emulates the Chip-8 system and allows users to play Chip-8 games on modern hardware. This project demonstrates the effectiveness of Python's default libraries in building emulation software.</p>
            <a href="https://github.com/ttom795/Chippure">View Project</a>
        </div>
        
        <div>
            <h3>Orangutan Monitor | OpenGL | C++</h3>
            <p>Orangutan Monitor is a standalone software application designed to monitor page-file size efficiently. It's particularly useful when paired with memory-intensive programs like Yuzu. This tool comes as a single .exe file without the need for additional dependencies or DLLs.</p>
            <a href="https://github.com/ttom795/OrangutanMonitor">View Project</a>
        </div>
        
        
      </div>
      <div className="column">
      
      <h2>Academic Projects</h2>
            <div>
            <h3>Dissertation 2023</h3>
            <p>My dissertation explores a novel pathfinding algorithm for Low Earth Orbit satellite networks - an improved version of my project done as a research assistant in 2022. It includes a problem statement, background knowledge on relevant topics, a literature review, the algorithm with code and pseudocode, implementation details, and a conclusion with results and challenges. The software itself is not publically available (yet) but the dissertation itself can be found <Link to="/resume">here</Link>.</p>
        </div>
    
        <div>
            <h3>Research Assistant 2022</h3>
            <p>Working with Dr. Ulrich Speidel, a professor with a focus on networks and communication, we developed software to demonstrate a novel routing algorithm to optimize the efficiency of LEO satellite communications, ultimately improving the way these satellites could function and communicate in space - available <a href="https://sde.blogs.auckland.ac.nz/leo-simulation/">here</a>.</p>
        </div>
    
        <div>
            <h3>Research Assistant 2021</h3>
            <p>Working under the supervision of Dr. Alex Shaw, a professor with a focus on Virtual Reality (VR) and interest in risk assessment, I developed a procedural construction site to create a Virtual Reality-based risk assessment training program tailored specifically for City Rail Link - a significant infrastructure project with complex challenges. I designed and incorporated various construction elements, such as cranes, heavy machinery, and workers.</p>
        </div>
      </div>
    </div>
    {/*
    <h2>Personal History</h2>
    <div className="timeline">
      <div className="row">
        <p className="dot"/>
      </div>

      <div className="container right">
        <div className="content">
          <h2>1999-2006</h2>
          <p>Born at an early age, I spent my childhood in England. At age 6, my family and I moved across the world to New Zealand.</p>
        </div>
      </div>

      <div className="row">
        <p className="dot"/>
      </div>

      <div className="container left">
        <div className="content">
          <h2>2006-2018</h2>
          <p>I attended school in West Auckland - specifically, Blockhouse Bay and Lynfield. After graduating from Lynfield College in 2017, I took a gap year to decide what I wanted to do with my life and to see the sights of Europe.</p>
        </div>
      </div>

      <div className="row">
        <p className="dot"/>
      </div>

      <div className="container right">
        <div className="content">
          <h2>2019-2023</h2>
          <p>I returned from my gap year in Europe to attend Waipapa Taumata Rau (the University of Auckland) and studied and completed my Bachelor's Degree in Computer Science. I attended the University of Auckland for an additional year to get my Honours Degree in the same subject.</p>
        </div>
      </div>

      <div className="row">
        <p className="dot"/>
      </div>

      <div className="container left">
        <div className="content">
          <h2>2023-?</h2>
          <p>Currently, I'm a working for the University of Auckland in an administrative capacity while balancing my roles as a programmer in a few game development teams, and as a volunteer at the Burnett Foundation Aotearoa.</p>
        </div>
      </div>
      
    
    </div>
    
    */}
    <h2>Fangames/Comissioned Work</h2>
        <ExpandableDiv content={
          <div>
        <div>
            <h3>LEGO Shonen Jump Fangame | UE4 | C++</h3>
            <p>As a request from a popular YouTuber, I developed an engaging LEGO-themed "Shonen Jump" Fangame, combining my passion for gaming and my favorite anime characters with the creativity that LEGO inspires. The project involved designing/implementing game mechanics and creating consistent visuals.</p>
            <a href="https://www.youtube.com/watch?v=y8eTJ9-lzck">View Showcase</a>
        </div>
        <div>
            <h3>My Hero Karting | UE4 | C++</h3>
            <p>Working with the same YouTuber, I developed an exciting racing game called "My Hero Karting," inspired by the popular anime "My Hero Academia." The project is a demonstration of the implementation of both AI and multiplayer functionality.</p>
            <a href="https://www.youtube.com/watch?v=HP80Jx8ig_g">View Showcase</a>
        </div>
    
        <div>
            <h3>Shield Hero Fangame | UE4 | C++</h3>
            <p>I'm also a fan of the anime "The Rising of the Shield Hero," so I decided to create a game based on the series. The project involved level design, balancing gameplay, and ensuring an immersive experience for players.</p>
            <a href="https://www.youtube.com/watch?v=eIJXXqUinnE">View Showcase</a>
        </div>
    
        <div>
            <h3>Mob Psycho Sentiment | UE4 | C++</h3>
            <p>Finally, I was suggested to create a short game which ended up being "Mob Psycho Sentiment," an action-platformer/sandbox based around the show of the same name. The game relies heavily on use of physics and has several different playable characters.</p>
            <a href="https://www.youtube.com/watch?v=J7PzyaBfuJA">View Showcase</a>
        </div>
        </div>}
        />
    </div>
    </React.Fragment>
    )
}