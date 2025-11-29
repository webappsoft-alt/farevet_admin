import React from 'react';
import { Document, Page } from 'react-pdf';
import 'react-pdf/dist/esm/Page/AnnotationLayer.css';
import 'react-pdf/dist/esm/Page/TextLayer.css';


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
