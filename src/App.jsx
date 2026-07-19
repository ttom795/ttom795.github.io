import React, { useRef } from 'react';
import { Route, Routes } from 'react-router-dom';
import PageLayout from "./PageLayout";
import ErrorPage from "./pages/ErrorPage";
import About from "./pages/About"
import Home from "./pages/Home"
import Resume from "./pages/Resume";
import Dissert from "./pages/Dissert";
import StockSimulator from "./pages/Stocks";
import "./styles.css"
import WikiPage from './pages/wiki';
import ProtectedRoute from './pages/ProtectedRoute';

function App(){
  const homeRef = useRef(null);
  const aboutRef = useRef(null);
  const resumeRef = useRef(null);
  const dissertRef = useRef(null);

  const refs = { homeRef, aboutRef, resumeRef, dissertRef };

  return (
    <React.Fragment>
      <Routes>
        <Route path="/" element={<PageLayout refs={refs} />}>
          <Route index element={
              <div>
                <div ref={homeRef}>
                  <Home />
                </div>
                <div ref={aboutRef}>
                  <About />
                </div>
                <div ref={resumeRef}>
                  <Resume />
                </div>
                <div ref={dissertRef}>
                  <Dissert />
                </div>
              </div>
            }
          />
          <Route path="*" element={<ErrorPage />} />

          <Route
            path="stocks"
            element={
              <ProtectedRoute>
                <StockSimulator />
              </ProtectedRoute>
            }
          />
          <Route
            path="wiki"
            element={
              <ProtectedRoute>
                <WikiPage />
              </ProtectedRoute>
            }
          />
        </Route>
      </Routes>
    </React.Fragment>
  );
}

export default App;