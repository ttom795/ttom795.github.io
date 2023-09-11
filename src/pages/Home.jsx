import React from "react"
import { Link } from "react-router-dom"

export default function Home() {
    return(
    <React.Fragment>
      <div className="fade-in-element">
      <div className="row">
      <div className="column">
      <h1>Toby Tomkinson</h1>
      <h3>Software Developer & Computer Science Graduate</h3>
      <p>Welcome to my portfolio website. I'm a recent computer science graduate passionate about exploring the world of technology and software development. During my academic journey, I've worked on several exciting projects that have improved my skills and demonstrated my love of coding. This website is one of them - made completely from scratch!</p>
      <p>Feel free to reach out to discuss future opportunities.</p>
      <Link to="/contact">
      <button type="button">
          CONTACT PAGE
      </button>
      </Link>
      </div>
      <div className="column">
        <div className="centerbox">
        <img src="face.jpg" style={{ width: "80%", transform: "rotate(5deg)", border: "10px solid white", boxShadow: "0 0 20px rgba(0, 0, 0, 0.25)" }}/>
        </div>
        <i>
        Hey look, it's me!
        </i>
      </div>
      </div>
    <p>Thank you for visiting my portfolio!</p>

    </div>
    </React.Fragment>
    )
}