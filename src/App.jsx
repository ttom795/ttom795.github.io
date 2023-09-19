import React from "react";
import { Route, Routes } from 'react-router-dom';
import { Navigate } from "react-router-dom";
import PageLayout from "./PageLayout";
import ErrorPage from "./pages/ErrorPage";
import About from "./pages/About"
import Home from "./pages/Home"
import Resume from "./pages/Resume";
import Dissert from "./pages/Dissert";
import "./styles.css"

function App() {
  return (
    <React.Fragment>
      <Routes>
        <Route path="/" element={<PageLayout />}>
          <Route index element={<Navigate to="home" replace={true} />}></Route>
          <Route path="home" element={<Home />}/>
          <Route path="about" element={<About />}/>
          <Route path="resume" element={<Resume />}/>
          <Route path="dissertation" element={<Dissert />}/>
          <Route path="*" element={<ErrorPage />}/>
        </Route>
      </Routes>
    </React.Fragment>
  );
}

export default App;