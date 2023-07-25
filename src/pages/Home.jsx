import React from "react"
import { Link } from "react-router-dom"

export default function Home() {
    return(
    <React.Fragment>
      <div className="fade-in-element">
      <h1>Welcome to My Digital Portfolio</h1>

    
      <div className="row">
      <div className="column">
      <p>Hello there! Welcome to my portfolio website. I'm a recent computer science graduate passionate about exploring the world of technology and software development. During my academic journey, I've worked on several exciting projects that have honed my skills and ignited my love for coding. This website is one of them - made from scratch!</p>
      <p>I'm eager to continue my journey in the world of software development and collaborate on exciting projects. Feel free to reach out to me using any of the methods from my <Link to="/contact">contact page</Link> to discuss opportunities or just to say hello!</p>
      </div>
      <div className="column">
        <div className="centerbox">
        <img src="face.jpg" style={{ width: "90%", transform: "rotate(5deg)", border: "10px solid white", boxShadow: "0 0 20px rgba(0, 0, 0, 0.25)" }}/>
        </div>
        Yours truly, Toby Tomkinson
      </div>
      </div>
    <p>Thank you for visiting my portfolio!</p>

    </div>
    </React.Fragment>
    )
}