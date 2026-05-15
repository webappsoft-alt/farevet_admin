import React from "react";
import { Document, Page, pdfjs } from "react-pdf";
import "react-pdf/dist/esm/Page/AnnotationLayer.css";
import "react-pdf/dist/esm/Page/TextLayer.css";

if (!pdfjs.GlobalWorkerOptions.workerSrc) {
  pdfjs.GlobalWorkerOptions.workerSrc = new URL(
    "pdfjs-dist/build/pdf.worker.min.js",
    import.meta.url,
  ).toString();
}


const ReactPdfViewer = ({ pdfSource }) => {
    return (
        <div>
            <Document file={pdfSource} onError={(error) => console.error('Error loading PDF:', error)}>
                <Page pageNumber={1} />
            </Document>
        </div>
    );
};

export default ReactPdfViewer;
