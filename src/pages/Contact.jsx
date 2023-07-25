import React from "react"

export default function Contact() {
    return(
    <React.Fragment>
      <div className="fade-in-element">
      <div className="row">
      <div className="column">
        <h1>Contact Me</h1>
        <p>I have a number of different contact methods - see my resume for LinkedIn, Github, etc. If you are wanting to contact me by the usual methods, please do so via the following links.</p>
      </div>
      <div className="column">

        <p><span className="bolded">Personal:</span></p> 
        <div className="contactdetails">
        <p>Phone: <a href="tel:+64272395676">(+64) 27 239-5676</a></p>
        <p>Email: <a href = "mailto: tobytomkinson@hotmail.co.nz">tobytomkinson@hotmail.co.nz</a></p>
        </div>
      
      </div>
      </div>
      </div>
      

</React.Fragment>
    )
}