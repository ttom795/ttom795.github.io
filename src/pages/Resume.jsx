import React, { useState } from "react";
import { Document, Page, pdfjs } from 'react-pdf';
import "react-pdf/dist/esm/Page/AnnotationLayer.css"

pdfjs.GlobalWorkerOptions.workerSrc = `//cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjs.version}/pdf.worker.js`;

const pdfURL1 = "ResumeCV.pdf";

export default function Resume() {
  const [numPages1, setNumPages1] = useState(null);
  const [currentPage1, setCurrentPage1] = useState(1);

  const onDocumentLoadSuccess1 = ({ numPages }) => {
    setNumPages1(numPages);
  };


  const handlePrevPage1 = () => {
    if (currentPage1 > 1) {
      setCurrentPage1(currentPage1 - 1);
    }
  };

  const handleNextPage1 = () => {
    if (currentPage1 < numPages1) {
      setCurrentPage1(currentPage1 + 1);
    }
  };

  return (
    <React.Fragment>
      <div className="fade-in-element">
            <h1>Resume</h1>
            <div className="centerbox">
            <button onClick={() => window.open(pdfURL1, "_blank")}>
              Open as PDF
            </button>
              <button onClick={handlePrevPage1} disabled={currentPage1 === 1}>
                Previous Page
              </button>
              <button onClick={handleNextPage1} disabled={currentPage1 === numPages1}>
                Next Page
              </button>
            </div>
            <Document file={pdfURL1} onLoadSuccess={onDocumentLoadSuccess1}>
              <Page pageNumber={currentPage1} renderTextLayer={false} />
            </Document>
      </div>
    </React.Fragment>
  );
}
