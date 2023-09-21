import React, { useState } from "react";
import { Document, Page, pdfjs} from 'react-pdf';
import "react-pdf/dist/esm/Page/AnnotationLayer.css"

pdfjs.GlobalWorkerOptions.workerSrc = `//cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjs.version}/pdf.worker.js`;

const pdfURL2 = "Dissertation.pdf";

export default function Dissert() {
  const [numPages2, setNumPages2] = useState(null);
  const [currentPage2, setCurrentPage2] = useState(1);

  const onDocumentLoadSuccess2 = ({ numPages }) => {
    setNumPages2(numPages);
  };

  const handlePrevPage2 = () => {
    if (currentPage2 > 1) {
      setCurrentPage2(currentPage2 - 1);
    }
  };

  const handleNextPage2 = () => {
    if (currentPage2 < numPages2) {
      setCurrentPage2(currentPage2 + 1);
    }
  };

  return (
    <React.Fragment>
      <div className="fade-in-element">
        <h1>Dissertation</h1>
          <div className="centerbox">
            <button onClick={() => window.open(pdfURL2, "_blank")}>
              Open as PDF
            </button>
              <button onClick={handlePrevPage2} disabled={currentPage2 === 1}>
                Previous Page
              </button>
              <button onClick={handleNextPage2} disabled={currentPage2 === numPages2}>
                Next Page
              </button>
            </div>
            <Document file={pdfURL2} onLoadSuccess={onDocumentLoadSuccess2}>
              <Page pageNumber={currentPage2} renderTextLayer={false} />
            </Document>
      </div>
    </React.Fragment>
  );
}
