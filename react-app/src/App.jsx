import React, { useEffect, useState } from 'react';
import Editor from './CM5Editor.jsx'
import runExplainer from './explainer.jsx';
import starterCode from './starter-code.js?raw';
import starterCode2 from './starter-code-2.py?raw';
import './App.css'


function App() {
  const editorRef = React.useRef();
  const [annotations, setAnnotations] = useState([]);

  useEffect(() => {
    const updateExplanations = async () => {
      const explanations = await runExplainer(starterCode); // Call the API logic when the app starts
      const { lineExplanations, blockExplanations, dataFlowExplanations } = explanations;

      // Add line annotations
      const lineAnnotations = lineExplanations.map(({ lineNumber, explanation }) => {
        return editorRef.current.addLineAnnotation(lineNumber, explanation);
      });
      setAnnotations(annotations.concat(lineAnnotations));

      // Add block annotations
      const blockAnnotations = blockExplanations.map(({ startLine, endLine, explanation }) => {
        return editorRef.current.addBlockAnnotation(startLine, endLine, explanation);
      });
      setAnnotations(annotations.concat(blockAnnotations));

      // Add data flow annotations
      const dataFlowAnnotations = dataFlowExplanations.map(({ paramName, explanation, lineNumber }) => {
        return editorRef.current.addDataFlowAnnotation(paramName, explanation, lineNumber);
      });
      setAnnotations(annotations.concat(dataFlowAnnotations))
    }

    const timeout = setTimeout(updateExplanations, 2000);
    return () => clearTimeout(timeout);

  }, []);

  return (
    <>
      <div className='editor-container'>
        <Editor ref={editorRef} initialCode={starterCode} />
      </div>
    </>
  )
}

export default App
