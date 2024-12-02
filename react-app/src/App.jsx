import React, { useEffect, useState } from 'react';
import Editor from './CM5Editor.jsx'
import runExplainer from './explainer.jsx';
import starterCode from './starter-code.js?raw';
import './App.css'


function App() {
  const editorRef = React.useRef();
  const [annotations, setAnnotations] = useState([]);

  useEffect(() => {
    const updateExplanations = async () => {
      const explanations = await runExplainer(starterCode); // Call the API logic when the app starts
      const { lineExplanations, blockExplanations } = explanations;

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
    }
    const timeout = setTimeout(updateExplanations, 2000);

    return () => clearTimeout(timeout);


    // Add a line annotation every 3 seconds
    // const interval = setInterval(() => {
    //   const editor = editorRef.current;
    //   let line = Math.floor(Math.random() * editor.currentCode().split('\n').length);
    //   setAnnotations(annotations.concat([editor.addLineAnnotation(line, 'This is a test annotation')]));
    //   console.log('annotations:', annotations);
    // }, 3000);

    // return () => clearInterval(interval);
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
