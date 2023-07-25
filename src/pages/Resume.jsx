import React from "react"
import { Document, Page, pdfjs } from 'react-pdf';
import "react-pdf/dist/esm/Page/AnnotationLayer.css"

pdfjs.GlobalWorkerOptions.workerSrc = `//cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjs.version}/pdf.worker.js`;

const pdfURL = "ResumeCV.pdf";

  const handleDownload = () => {
    const link = document.createElement('a');
    link.href = pdfURL;
    link.download = 'ResumeCV.pdf';
    link.click();
  };

export default function Resume() {
    return(
    <React.Fragment>
      <div className="fade-in-element">
      <h1>My Resume</h1>
      <button onClick={handleDownload}>Download PDF</button>
      <div
        style={{
          height: '400px',
          overflowY: 'scroll',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
        }}
      >
        <Document file={pdfURL}>
          <Page pageNumber={1} renderTextLayer={false}/>
          <Page pageNumber={2} renderTextLayer={false}/>
        </Document>
      </div>
      </div>
    </React.Fragment>
    )
}