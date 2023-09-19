import React from "react"
import { Link } from "react-router-dom"

export default function Home() {
    return(
    <React.Fragment>
      <div className="fade-in-element">

      <h1>Toby Tomkinson</h1>
      <h2>Software Developer & Computer Science Graduate</h2>

      <div id="grid">

      <div>
        <p>Welcome to my portfolio website. I'm a recent computer science graduate passionate about exploring the world of technology and software development. During my academic journey, I've worked on several exciting projects that have improved my skills and demonstrated my love of coding. This website is one of them - made completely from scratch!</p>
        <p>Feel free to reach out to discuss future opportunities.</p>
        <Link to="/resume">
        <button type="button">
            RESUME PAGE
        </button>
        </Link>
      </div>

      <div>
        <div className="centerbox">
        <img src="face.jpg" style={{ width: "70%", transform: "rotate(5deg)", border: "10px solid white", boxShadow: "0 0 20px rgba(0, 0, 0, 0.25)" }}/>
        </div>
        <Link to="https://www.linkedin.com/in/toby-j-tomkinson/">
        <button type="button">
            LINKEDIN PAGE
        </button>
        </Link>
      </div>
      </div>
    </div>
    </React.Fragment>
    )
}