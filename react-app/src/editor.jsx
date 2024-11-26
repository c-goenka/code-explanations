import React, { useState } from 'react'
import CodeMirror from '@uiw/react-codemirror';
import { javascript } from '@codemirror/lang-javascript';
import starterCode from './starter-code.js?raw';
import './editor.css';

function Editor() {
  const [code, setCode] = React.useState(starterCode)

  // const refs = React.useRef({});
  // React.useEffect(() => {
  //   if (refs.current?.view) console.log('EditorView:', refs.current?.view);
  //   if (refs.current?.state) console.log('EditorState:', refs.current?.state);
  //   if (refs.current?.editor) console.log('HTMLDivElement:', refs.current?.editor);
  // }, [refs.current]);

  const handleCodeChange = (value) => {
    setCode(value)
  //   let elt = document.createElement('div');
  //     elt.innerHTML = 'Test widget';
  //   refs.current?.editor.addWidget({line: 10, ch:3}, elt)
  }

  return (
    <>
      <div className='editor-container'>
        {/* <h3>Code Editor</h3> */}
        <CodeMirror
          value={code}
          extensions={[javascript({ jsx: true })]}
          onChange={handleCodeChange}
          theme={'light'}
          options={{
            lineNumbers: true,
            tabSize: 2,
          }}
          style={{
              border: '1px solid #ddd',
              textAlign: 'left',
          }}
        />
      </div>
    </>
  )
  }

  export default Editor
