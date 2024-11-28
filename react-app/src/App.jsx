import React, { useEffect, useState } from 'react';
import Editor from './CM5Editor.jsx'
import runExplainer from './explainer.jsx';
import starterCode from './starter-code.js?raw';
import './App.css'


function App() {
  const editorRef = React.useRef();
  const [annotations, setAnnotations] = useState([]);

  useEffect(() => {
    runExplainer(); // Call the API logic when the app starts

    const interval = setInterval(() => {
      const editor = editorRef.current;
      let line = Math.floor(Math.random() * editor.currentCode().split('\n').length);
      setAnnotations(annotations.concat([editor.addLineAnnotation(line, 'This is a test annotation')]));
      console.log('annotations:', annotations);
    }, 3000);

    return () => clearInterval(interval);
  });

  return (
    <>
      <div className='editor-container'>
        <Editor ref={editorRef} initialCode={starterCode} />
      </div>
    </>
  )
}

export default App
