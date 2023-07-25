import { useState } from "react";
import React from "react";
import "../timeline.css"

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
        {isExpanded ? 'Hide Section' : 'View Section'}
      </button>
      <div style={divStyle}>{isExpanded ? content : ""}</div>
    </div>
  );
};

export default function About() {
    return(
    <React.Fragment>
      <div className="fade-in-element">

      <h1>About Myself</h1>
      <p>My name is Toby, and I'm a hardworking, reliable, and motivated individual with a strong computer and technology orientated background and a desire to improve myself.
        <br/><br/>
        With a BSc in Computer Science (Honours) and practical experience in support-based, technical and customer-facing roles, I thrive in environments where I'm exposed to a variety of experiences and challenges.
        <br/><br/>
        My coursework and personal projects have provided me with a solid foundation in technical skills, time management and managing a working environment with evolving requirements. 
        My involvement in agile software development and collaborative workshops at the University of Auckland has honed my ability to work within a team, deliver successful software solutions, and ensure customer satisfaction.
        <br/><br/>
        Throughout my professional experiences, I have actively engaged with customers in a variety of contexts - from hospitality, to administration, to project stakeholders. This has allowed me to develop strong interpersonal skills and the ability to bridge technical and business requirements effectively.  
        Furthermore, I possess "fantastic written and verbal communication skills", which have been cultivated through my experience in customer-facing roles over multiple years.</p>
      
      <h2>Projects</h2>
      <ExpandableDiv content={
        <div>
            <div>
            <h3>LEGO "Shonen Jump" Fangame</h3>
            <p>As a request from a popular YouTuber, I developed an engaging LEGO-themed "Shonen Jump" Fangame, combining my passion for gaming and my favorite anime characters with the creativity that LEGO inspires. The project involved designing game mechanics, implementing AI, and creating captivating and consistent visuals.</p>
            <a href="https://www.youtube.com/watch?v=y8eTJ9-lzck">View Showcase</a>
        </div>
    
        <div>
            <h3>My Hero Karting</h3>
            <p>Working with the same YouTuber, I developed an exciting racing game called "My Hero Karting," inspired by the popular anime "My Hero Academia." The more unique aspects of this was the frontend development and implementation of multiplayer functionality.</p>
            <a href="https://www.youtube.com/watch?v=HP80Jx8ig_g">View Showcase</a>
        </div>
    
        <div>
            <h3>Shield Hero Fangame</h3>
            <p>I'm also an fan of the anime "The Rising of the Shield Hero," so I decided to create a game based on the series. The project involved level design, balancing gameplay, and ensuring an immersive experience for players.</p>
            <a href="https://www.youtube.com/watch?v=eIJXXqUinnE">View Showcase</a>
        </div>
    
        <div>
            <h3>Mob Psycho Sentiment</h3>
            <p>Finally, I was suggested to create a short game which ended up being "Mob Psycho Sentiment," an action-platformer/sandbox based around the show of the same name. The game relies heavily on use of physics and has several different playable characters</p>
            <a href="https://www.youtube.com/watch?v=J7PzyaBfuJA">View Showcase</a>
        </div>
        </div>
      }/>
      <h2>Personal History</h2>
      <ExpandableDiv content = {
        
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
          <p>I attended school in West Auckland - Blockhouse Bay and Lynfield. After graduating from Lynfield College in 2017, I took a gap year to decide what I wanted to do with my life and to see the sights of Europe.</p>
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
          <h2>Today</h2>
          <p>Currently, I'm a receptionist working for the University of Auckland while balancing my roles as a programmer for a few game development teams and as a volunteer at the Burnett Foundation Aotearoa.</p>
        </div>
      </div>
      
    
    </div>
      }/>
    </div>
    
    </React.Fragment>
    )
}