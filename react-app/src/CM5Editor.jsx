import React, { Component } from 'react';
import CodeMirror from 'codemirror';
import 'codemirror/mode/javascript/javascript'
import 'codemirror/keymap/sublime';
import 'codemirror/addon/selection/active-line';
import 'codemirror/addon/lint/lint';
import 'codemirror/addon/lint/javascript-lint';
import 'codemirror/addon/comment/comment';
import 'codemirror/lib/codemirror.css'

class Editor extends Component {
  constructor(props) {
    super(props);
    this.beep = {
      play() {
        // console.log("word!");
      }
    }

    this._markedLines = [];
    this._activeEvaluations = [];
  }

  createError(severity, line, ch, message, showMessage) {
    let charIndicator = document.createElement('div');
    charIndicator.className = "callout error";
    charIndicator.innerHTML = `<div class="indicator"></div>`
    let messageBox = document.createElement('div');
    messageBox.className = "callout error";
    messageBox.innerHTML = `<div class="box">
                              <div class="close">&times;</div>
                              <span>${message}</span>
                              <div class="border-notch notch"></div>
                              <div class="notch"></div>
                            </div>`
    if (showMessage) {
      this._cm.addWidget({line:line+1, ch:ch}, messageBox);
    } else {
      charIndicator.onmouseenter = () => {
        this._cm.addWidget({line:line+1, ch:ch}, messageBox);
      }
    }
    messageBox.getElementsByClassName('close')[0].onclick = () => {
      messageBox.remove();
    }
    this._cm.addWidget({line:line+1, ch:ch}, charIndicator);
    var lineHandle = this._cm.addLineClass(line+1, 'wrap', 'line-warning');
    this._markedLines.push(lineHandle);
  }

  clearErrors() {
    this._markedLines.forEach(line => this._cm.removeLineClass(line, 'wrap', 'line-warning'));
    this._markedLines = [];
    Array.from(document.getElementsByClassName('error')).forEach((elt) => elt.remove());
  }

  getNodePosition(node) {
    return this._cm.posFromIndex(node.start);
  }

  componentDidMount() {
    // console.log("making CM", Editor.lintOptions)
    if (this._cm) {
      return;
    }
    this._cm = CodeMirror(this.cmContainer, { // eslint-disable-line
      theme: `${this.props.theme}`,
      mode: "javascript",
      value: this.props.initialCode,
      tabSize: 2,
      lineNumbers: true,
      styleActiveLine: true,
      inputStyle: 'contenteditable',
      lineWrapping: false,
      fixedGutter: false,
      // gutters: ['CodeMirror-lint-markers'],
      // keyMap: 'sublime',
      highlightSelectionMatches: true, // highlight current search match
      // lint: {
      //   onUpdateLinting: debounce((annotations) => {
      //     if (this._errorsFrozen) {
      //       return;
      //     }
      //     this.clearErrors();
      //     annotations.forEach((x) => {
      //       if (annotations.length > 1 && x.message.startsWith("Unrecoverable syntax error")) {
      //         return;
      //       }
      //       // console.log(x, Editor.lintOptions);
      //       if (x.from.line > -1) {
      //         this.createError(x.severity, (x.from.line - 1), x.from.ch, x.message);
      //       }
      //     });
      //     if (this._markedLines.length > 0 && this.props.lintWarning !== false) {
      //       this.beep.play();
      //     }
      //   }, 2000),
      //   options: Editor.lintOptions
      // }
    });
    this._cm.on('change', () => { this._errorsFrozen = false; this.props.onChange() });

    this._cm.setSize("100%", "100%")
  }

  // _cm: CodeMirror.Editor

  render() {
    return <div className="cm-container" ref={(elt) => this.cmContainer = elt}></div>
  }

  currentCode() {
    return this._cm.getDoc().getValue();
  }

  setCode(code) {
    this._cm.getDoc().setValue(code);
  }

  disableEditing() {
    this._cm.setOption('readOnly', 'nocursor');
  }

  enableEditing() {
    this._cm.setOption('readOnly', false);
  }

  // freezeErrors() {
  //   this._errorsFrozen = true;
  // }

  // highlightNode(frame, stack) {
  //   var nodeType = frame.node.type;
  //   if (nodeType === 'Program') { return; }
  //   var startPos = this._cm.posFromIndex(frame.node.start);
  //   var endPos = this._cm.posFromIndex(frame.node.end);

  //   var mark = this._cm.markText(startPos, endPos, {className:'nodehighlight eval'+stack.length});

  //   if (! frame.node.__extra) {
  //     frame.node.__extra = {};
  //   }
  //   frame.node.__extra.pos = {start: startPos, end: endPos};
  //   if (! frame.node.__extra.marks) {
  //     frame.node.__extra.marks = [];
  //   }
  //   frame.node.__extra.marks.push(mark);
  // }
  // unhighlightNode(frame, stack) {
  //   var nodeType = frame.node.name;
  //   if (nodeType === 'Program') { return; }

  //   if (frame.node.__extra && frame.node.__extra.marks) {
  //     frame.node.__extra.marks.pop().clear();
  //   }
  // }

  // showGlobalVariables(frame) {
  //   return frame.node.declarations.map(decl => {
  //     if (! extra(decl).callout) {
  //       let elt = document.createElement('div')
  //       elt.className = "callout vartracker"

  //       let handler = new SingleVarTracker(frame.scope, decl, elt);
  //       handler.render();

  //       let pos = this._cm.posFromIndex(decl.init ? decl.init.start : decl.end);
  //       this._cm.addWidget(pos, elt);

  //       extra(decl).callout = handler;

  //       return handler;
  //     } else {
  //       return null;
  //     }
  //   }).filter(h => h !== null);
  // }

  // showLocalVariables(frame) {
  //   return frame.node.declarations.map(decl => {
  //     let elt = document.createElement('div')
  //     elt.className = "callout vartracker"

  //     let handler = new SingleVarTracker(frame.scope, decl, elt);
  //     handler.render();

  //     let pos = this._cm.posFromIndex(decl.init ? decl.init.start : decl.end);
  //     this._cm.addWidget(pos, elt);

  //     extra(decl).callout = handler;

  //     return handler;
  //   }).filter(h => h !== null);
  // }

  addLineAnnotation(line, annotation) {
    // let line = Math.floor(Math.random() * this._cm.getDoc().lineCount());

    // Extract the first two words from the annotation
    const [previewText, ...rest] = annotation.split(':');

    // Create the annotation element
    let annotationElement = document.createElement('div');
    annotationElement.className = 'line-annotation';

    // Add the preview text
    let previewElement = document.createElement('span');
    previewElement.textContent = previewText;

    let fullTextElement = document.createElement('span')
    fullTextElement.innerHTML = annotation;
    fullTextElement.style.display = 'none'; // Hide by default
    fullTextElement.style.marginLeft = '0.5em';

    // Show/hide full text on hover
    annotationElement.addEventListener('mouseenter', () => {
      fullTextElement.style.display = 'inline';
      previewElement.style.display = 'none'; // Hide preview text
    });
    annotationElement.addEventListener('mouseleave', () => {
      fullTextElement.style.display = 'none';
      previewElement.style.display = 'inline'; // Show preview text
    });

    annotationElement.appendChild(previewElement);
    annotationElement.appendChild(fullTextElement);

    // Add the annotation widget to the CodeMirror editor
    let pos = this._cm.posFromIndex(this._cm.getDoc().indexFromPos({ line: line, ch: 0 }) - 1);
    this._cm.addWidget(pos, annotationElement);

    return;
  }

  addBlockAnnotation(startLine, endLine, annotation) {
    // let line = Math.floor(Math.random() * this._cm.getDoc().lineCount());
    // let annotationElement = document.createElement('div');
    // annotationElement.className = 'block-annotation';
    // annotationElement.innerHTML = annotation;

    // let startPos = this._cm.posFromIndex(this._cm.getDoc().indexFromPos({line: startLine-1, ch: 0})-1);
    // this._cm.addWidget(startPos, annotationElement);

    // Find the longest line in the block
    let maxLineLength = 0;
    let longestLine = startLine; // Default to the start line
    for (let i = startLine - 1; i <= endLine - 1; i++) {
      const lineContent = this._cm.getLine(i); // Get content of each line
      if (lineContent.length > maxLineLength) {
        maxLineLength = lineContent.length;
        longestLine = i;
      }
    }

    // Calculate the position of the last character in the longest line
    const longestLineContent = this._cm.getLine(longestLine);
    const lastCharCoords = this._cm.charCoords(
      { line: longestLine, ch: longestLineContent.length }, // Position of the last character
      'local'
    );

    // Calculate the top and bottom positions of the block
    const startCoords = this._cm.charCoords({ line: startLine - 1, ch: 0 }, 'local');
    const endCoords = this._cm.charCoords({ line: endLine - 1, ch: 0 }, 'local');

    // Create the vertFal line
    const verticalLine = document.createElement('div');
    verticalLine.className = 'vertical-line';

    // Set its position and dimensions
    verticalLine.style.top = `${startCoords.top}px`;
    verticalLine.style.left = `${lastCharCoords.right + 150}px`; // Adjust this value as needed
    verticalLine.style.height = `${endCoords.bottom - startCoords.top}px`;

    // Add hoverable explanation
    const explanationElement = document.createElement('div');
    explanationElement.className = 'block-explanation';
    explanationElement.textContent = annotation;
    explanationElement.style.display = 'none'; // Hidden by default

    // Add hover functionality to show the explanation
    verticalLine.addEventListener('mouseenter', () => {
      explanationElement.style.display = 'block';
    });
    verticalLine.addEventListener('mouseleave', () => {
      explanationElement.style.display = 'none';
    });

    // Append the explanation and the vertical line to CodeMirror's container
    const wrapper = this._cm.getWrapperElement();
    wrapper.appendChild(verticalLine);
    wrapper.appendChild(explanationElement);

    // Position the explanation element
    explanationElement.style.position = 'absolute';
    explanationElement.style.top = `${startCoords.top}px`;
    explanationElement.style.left = `${lastCharCoords.right + 165}px`; // Place to the right of the vertical line

    return null;
  }

  addDataFlowAnnotation(paramName, explanation, lineNumber) {
    // Get the full code text from CodeMirror.
    const allTheCode = this._cm.getValue();
    const codeLines = allTheCode.split('\n');
    // Convert provided lineNumber (1-indexed) to a 0-indexed value.
    const lineIndex = lineNumber - 1;

    // Find the starting character index of the parameter in the line.
    // (This is the logic you mentioned.)
    const lineText = codeLines[lineIndex];
    const ch = lineText.indexOf(paramName);
    if (ch === -1) {
      console.warn(`Parameter "${paramName}" not found on line ${lineNumber}.`);
      return;
    }
    const startPos = { line: lineIndex, ch: ch };
    const endPos = { line: lineIndex, ch: ch + paramName.length };

    // Create an inline element to highlight the parameter.
    const paramElement = document.createElement('span');
    paramElement.textContent = paramName;
    paramElement.className = 'data-flow-annotation'; // Add this class to your CSS for custom styling.

    // Create a tooltip element to display the explanation.
    const tooltipElement = document.createElement('div');
    tooltipElement.className = 'data-flow-tooltip'; // Add styling via CSS if desired.
    tooltipElement.innerHTML = explanation;
    tooltipElement.style.display = 'none';
    tooltipElement.style.position = 'absolute';
    tooltipElement.style.backgroundColor = '#f9f9f9';
    tooltipElement.style.border = '1px solid #ccc';
    tooltipElement.style.padding = '5px';
    tooltipElement.style.borderRadius = '4px';
    tooltipElement.style.zIndex = '10000';

    // Append the tooltip to the CodeMirror wrapper so that it overlays the editor.
    const wrapper = this._cm.getWrapperElement();
    wrapper.appendChild(tooltipElement);

    // Add event listeners so that the tooltip shows on hover.
    paramElement.addEventListener('mouseenter', () => {
      tooltipElement.style.display = 'block';
      // Position the tooltip near the parameter element.
      const rect = paramElement.getBoundingClientRect();
      tooltipElement.style.top = `${rect.bottom + window.scrollY}px`;
      tooltipElement.style.left = `${rect.left + window.scrollX}px`;
    });
    paramElement.addEventListener('mouseleave', () => {
      tooltipElement.style.display = 'none';
    });

    // Mark the text corresponding to the parameter with the custom element.
    // Using the `replacedWith` option will swap out the text for our element.
    this._cm.markText(startPos, endPos, {
      replacedWith: paramElement,
      clearOnEnter: false, // Keep the marker in place.
    });
  }

  // showFrameScope(frame) {
  //   let node = frame.node;
  //   let scope = frame.scope;

  //   let scopeViewElement = document.createElement('div');
  //   scopeViewElement.className = "callout vartracker";

  //   let scopeHandler = new Scope(scope, scopeViewElement);
  //   scopeHandler.render();

  //   let pos = this._cm.posFromIndex(node.start);

  //   this._cm.addWidget(pos, scopeViewElement);
  //   node.__extra.scope = scopeHandler;

  //   return scopeHandler;
  // }

  // removeFrameScope(frame) {
  //   if (frame.node.__extra && frame.node.__extra.scope) {
  //     frame.node.__extra.scope.remove();
  //     if (frame.node.__extra.subscopes) {
  //       frame.node.__extra.subscopes.forEach(v => v.remove());
  //     }
  //   }
  // }

  // clearFrameScopes() {
  //   Array.from(document.getElementsByClassName('scope')).forEach(elt => elt.parentElement.remove());
  //   Array.from(document.getElementsByClassName('variable')).forEach(elt => elt.parentElement.remove());
  // }

  // createExpressionDemonstratorCallout(index) {
  //   let elt = document.createElement('div');
  //   elt.className = "callout expression-demonstrator";

  //   this._cm.addWidget(this._cm.posFromIndex(index), elt);

  //   return elt;
  // }

  // clearExpressionDemonstrators() {
  //   Array.from(document.getElementsByClassName('expression-demonstrator')).forEach(elt => elt.remove());
  // }
}

Editor.lintOptions = {
  'asi': true,
  'eqeqeq': false,
  '-W041': false,
  '-W083': false // loopfunc
};



// class Scope {
//   constructor(scope, elt) {
//     this.scope = scope;
//     this.elt = elt;
//     this.showHidden = false;
//   }

//   static functionName(v, plainText=false) {
//     return v.nativeFunc ? (v.__name || v.nativeFunc.name) : (v.node.id ? v.node.id.name : (plainText ? "anonymous" : "<em>anonymous</em>"))
//   }

//   static tableIfy(arrOfObjects, strong=false, depth=0) {
//     let cNames = Object.keys(arrOfObjects[0].properties);
//     return '<table><thead>'+
//       '<tr><th><em>#</em></th>'+cNames.map(name => '<th>'+hideBadEntities(name)+'</th>').join('')+'</tr>'+
//       '</thead><tbody>'+
//       arrOfObjects.map((o,i) => '<tr><th>'+i+'</th>'+cNames.map(name => '<td>'+(name in o.properties ? Scope.stringValue(o.properties[name], strong, depth+1) : '')+'</td>').join('')+'</tr>').join('')+
//       '</tbody></table>'
//   }

//   static stringValue(v, strong=true, depth=0) {
//     if (depth > 3) {
//       return "...";
//     }
//     if (typeof(v) === 'object' && v !== null) {
//       switch(v.class) {
//       case 'Function':
//         return `function <strong>${Scope.functionName(v)}</strong>`;
//       case 'Array':
//         let arr = Array.from(v.properties)
//         if (depth === 0 && arr.length > 0 && arr.every(e => (typeof(e) === 'object' && e.class !== 'Function' && (! (e.__native) || ! ('toString' in e.__native))))) {
//           return Scope.tableIfy(arr, strong, depth+1)
//         }
//         return `[${arr.map((v, i) => `<sup>#${i}</sup>`+Scope.stringValue(v, strong, depth+1)).join(', ')}]`;
//       default:
//         // normal object?
//         if (v.__native && 'toString' in v.__native) {
//           return v.__native.toString();
//         }
//         let src = v.properties || v;
//         let keys = Object.keys(src);
//         if (keys.length > 20) {
//           return "{...lots...}";
//         }
//         return `{${keys.map(k => k+": "+Scope.stringValue(src[k], strong, depth+1)).join(', ')}}`;
//       }
//     } else if (typeof(v) === 'string') {
//       return strong ? `"<strong>${hideBadEntities(v)}</strong>"` : `"${hideBadEntities(v)}"`;
//     } else if (typeof(v) === 'number') {
//       let s = String(v).replace(/(\.\d\d\d)\d+$/, '$1(…)');
//       return strong ? `<strong>${s}</strong>` : s;
//     } else {
//       return strong ? `<strong>${hideBadEntities(String(v))}</strong>` : hideBadEntities(String(v));
//     }
//   }

//   static plainTextValue(v, depth=0) {
//     if (depth > 4) {
//       return "...";
//     }
//     if (typeof(v) === 'object' && v !== null) {
//       switch(v.class) {
//       case 'Function':
//         return `function ${Scope.functionName(v, true)}`;
//       case 'Array':
//         return `[${Array.from(v.properties).map((v, i) => Scope.plainTextValue(v, depth+1)).join(', ')}]`;
//       default:
//         // normal object?
//         if (v.__native && 'name' in v.__native) {
//           return v.__native.toString();
//         }
//         let src = v.properties || v;
//         let keys = Object.keys(src);
//         if (keys.length > 20) {
//           return "{...lots...}";
//         }
//         return `{${keys.map(k => k+": "+Scope.plainTextValue(src[k], depth+1)).join(', ')}}`;
//       }
//     } else if (typeof(v) === 'string'){
//       return `"${hideBadEntities(v)}"`;
//     } else {
//       return hideBadEntities(String(v));
//     }
//   }

//   value(k) {
//     return Scope.stringValue(this.scope.properties[k]);
//   }

//   render() {
//     this.elt.innerHTML = ['<table class="scope">',
//       this.scope.properties
//         ? Object.keys(this.scope.properties)
//             .filter(k => ! this.scope.varz || this.scope.varz.indexOf(k) < 0)
//             .filter(this.showHidden ? k => k : k => k !== 'this' && k !== 'arguments')
//             .map(k => `<tr class="scope-entry"><th>${k}</th><td>${this.value(k)}</td></tr>`)
//             .join("")
//         : "",
//       '</table>'].join('\n');

//   }

//   update() {
//     this.render();
//   }

//   remove() {
//     this.elt.remove();
//   }
// }

// class SingleVarTracker {
//   constructor(scope, declaration, elt) {
//     this.scope = scope;
//     this.name = declaration.id.name;
//     this.elt = elt;
//   }

//   render() {
//     let v = Scope.stringValue(this.scope.properties[this.name]);
//     this.elt.innerHTML = `<div class="variable">${v}</div>`
//   }

//   update() {
//     this.render();
//   }

//   remove() {
//     this.elt.remove();
//   }
// }



export default Editor;
// export { Editor, Scope };
export { Editor };
