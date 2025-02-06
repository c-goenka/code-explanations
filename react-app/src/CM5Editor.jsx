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

  addLineAnnotation(line, annotation) {
    // Extract the first two words from the annotation
    const [previewText, ...rest] = annotation.split(':');

    // Create the annotation element
    let annotationElement = document.createElement('div');
    annotationElement.className = 'line-annotation';

    // Save the line number for later reference
    annotationElement.dataset.line = line;

    // Add the preview text
    let previewElement = document.createElement('span');
    previewElement.textContent = previewText;

    let fullTextElement = document.createElement('span')
    fullTextElement.innerHTML = annotation;
    fullTextElement.style.display = 'none'; // Hide by default
    // fullTextElement.style.marginLeft = '0.5em';

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
    // Find the longest line in the block based on code length
    let maxLineLength = 0;
    let longestLine = startLine; // Default to the start line
    for (let i = startLine - 1; i <= endLine - 1; i++) {
      const lineContent = this._cm.getLine(i);
      if (lineContent.length > maxLineLength) {
        maxLineLength = lineContent.length;
        longestLine = i;
      }
    }

    // Get CodeMirror's coordinate information
    const longestLineContent = this._cm.getLine(longestLine);
    const lastCharCoords = this._cm.charCoords(
      { line: longestLine, ch: longestLineContent.length },
      'local'
    );
    const startCoords = this._cm.charCoords({ line: startLine - 1, ch: 0 }, 'local');
    const endCoords = this._cm.charCoords({ line: endLine - 1, ch: 0 }, 'local');

    // Create the vertical line element
    const verticalLine = document.createElement('div');
    verticalLine.className = 'vertical-line';
    // Set a lower z-index so it appears behind line annotations.
    verticalLine.style.zIndex = '9000';

    // Get the CodeMirror wrapper for relative positioning.
    const wrapper = this._cm.getWrapperElement();
    const wrapperRect = wrapper.getBoundingClientRect();

    // Try to find the annotation widget for the longest line.
    // Note: since we set dataset.line in addLineAnnotation, we use longestLine+1 because addLineAnnotation uses 1-indexed line numbers.
    const annotationForLongestLine = wrapper.querySelector(`.line-annotation[data-line="${longestLine + 1}"]`);

    let leftPosition;
    if (annotationForLongestLine) {
      // Get its position relative to the wrapper
      const annRect = annotationForLongestLine.getBoundingClientRect();
      leftPosition = (annRect.right - wrapperRect.left) + 20; // 10px offset to the right
    } else {
      // Fallback: use the right coordinate of the code text.
      leftPosition = lastCharCoords.right + 10;
    }

    verticalLine.style.left = `${leftPosition}px`;
    verticalLine.style.top = `${startCoords.top}px`;
    verticalLine.style.height = `${endCoords.bottom - startCoords.top}px`;

    // Create the explanation element (for hover)
    const explanationElement = document.createElement('div');
    explanationElement.className = 'block-explanation';
    explanationElement.textContent = annotation;
    explanationElement.style.display = 'none';
    explanationElement.style.position = 'absolute';

    // Add hover functionality
    verticalLine.addEventListener('mouseenter', () => {
      explanationElement.style.display = 'block';
    });
    verticalLine.addEventListener('mouseleave', () => {
      explanationElement.style.display = 'none';
    });

    // *** Alternative approach: Append the vertical line to the CodeMirror scroll element ***
    const scroller = this._cm.getScrollerElement();
    scroller.appendChild(verticalLine);
    wrapper.appendChild(explanationElement);

    // Position the explanation element (adjust as needed)
    explanationElement.style.top = `${startCoords.top}px`;
    explanationElement.style.left = `${leftPosition + 15}px`; // 15px to the right of the vertical line

    return null;
  }

  addDataFlowAnnotation(paramName, explanation, functionDefinitionLineNumber, occurences) {
    // Get the full code text from CodeMirror.
    const allTheCode = this._cm.getValue();
    const codeLines = allTheCode.split('\n');
    // Convert provided lineNumber (1-indexed) to a 0-indexed value.
    const lineIndex = functionDefinitionLineNumber - 1;

    // Find the starting character index of the parameter in the line.
    const lineText = codeLines[lineIndex];
    const parenIndex = lineText.indexOf('(');
    let ch = -1;
    if (parenIndex !== -1) {
      // Start searching from the opening parenthesis
      ch = lineText.indexOf(paramName, parenIndex);
    } else {
      // Fallback: search the whole line if no parenthesis is found.
      ch = lineText.indexOf(paramName);
    }

    if (ch === -1) {
      console.warn(`Parameter "${paramName}" not found on line ${functionDefinitionLineNumber}.`);
      return;
    }
    const startPos = { line: lineIndex, ch: ch };
    const endPos = { line: lineIndex, ch: ch + paramName.length };

    // Create an inline element to highlight the parameter.
    const paramElement = document.createElement('span');
    paramElement.textContent = paramName;
    paramElement.className = 'data-flow-annotation'; // Add this class to your CSS for custom styling.

    // Add a custom attribute to track toggle state.
    paramElement.dataset.occurrencesVisible = "false";
    // Prepare an array to hold occurrence markers so we can remove them later.
    paramElement.occurrenceMarkers = [];

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

    // Temporarily force the tooltip to render for measurement.
    tooltipElement.style.visibility = 'hidden';

    // Force a reflow and get the height.
    const tooltipHeight = tooltipElement.offsetHeight;

    // Now hide it again.
    tooltipElement.style.display = 'none';
    tooltipElement.style.visibility = 'visible';

    // Add event listeners so that the tooltip shows on hover.
    paramElement.addEventListener('mouseenter', () => {
      tooltipElement.style.display = 'block';
      // Get the bounding rectangle for the parameter element.
      const rect = paramElement.getBoundingClientRect();

      // Calculate a new position for the tooltip.
      // Here, we position it above the highlighted text with a small gap.
      const tooltipGap = 25; // Adjust this value as needed.
      tooltipElement.style.top = `${rect.top + window.scrollY - tooltipHeight - tooltipGap}px`;
      // Center the tooltip horizontally relative to the highlighted text.
      tooltipElement.style.left = `${rect.left + window.scrollX}px`;
    });

    paramElement.addEventListener('mouseleave', () => {
      tooltipElement.style.display = 'none';
    });


    paramElement.addEventListener('click', () => {
      // Check current toggle state
      const currentlyVisible = paramElement.dataset.occurrencesVisible === "true";
      if (!currentlyVisible) {
        // Toggle on: highlight all occurrences.
        this.showOccurrenceMarkers(paramElement, occurences); // We'll define this function next.
        paramElement.dataset.occurrencesVisible = "true";
      } else {
        // Toggle off: remove all occurrence highlights.
        this.hideOccurrenceMarkers(paramElement);
        paramElement.dataset.occurrencesVisible = "false";
      }
    });

    // Mark the text corresponding to the parameter with the custom element.
    // Using the `replacedWith` option will swap out the text for our element.
    this._cm.markText(startPos, endPos, {
      replacedWith: paramElement,
      clearOnEnter: false, // Keep the marker in place.
    });
  }

  showOccurrenceMarkers(paramElement, occurrences) {
    // Ensure paramElement has a property to store markers.
    paramElement.occurrenceMarkers = [];

    // Get the full code text and split into lines.
    const allTheCode = this._cm.getValue();
    const codeLines = allTheCode.split('\n');

    // For each occurrence object, find its location and mark it.
    occurrences.forEach(occ => {
      const occLineIndex = occ.lineNumber - 1;  // Convert to 0-indexed.
      const occLineText = codeLines[occLineIndex];

      // Find all occurrences in the line (or at least the first occurrence).
      // You might want to refine this logic if a variable appears more than once on the same line.
      let ch = occLineText.indexOf(paramElement.textContent);
      if (ch === -1) {
        console.warn(`Occurrence of "${paramElement.textContent}" not found on line ${occ.lineNumber}.`);
        return;
      }
      const startPos = { line: occLineIndex, ch: ch };
      const endPos = { line: occLineIndex, ch: ch + paramElement.textContent.length };

      // Create a marker element for this occurrence.
      const occElement = document.createElement('span');
      occElement.textContent = paramElement.textContent;
      occElement.className = 'occurrence-highlight'; // Create a new CSS class for styling.

      // Create a tooltip for this occurrence.
      const occTooltip = document.createElement('div');
      occTooltip.className = 'occurrence-tooltip';
      occTooltip.innerHTML = occ.explanation;
      occTooltip.style.display = 'none';
      occTooltip.style.position = 'absolute';
      occTooltip.style.backgroundColor = '#f9f9f9';
      occTooltip.style.border = '1px solid #ccc';
      occTooltip.style.padding = '5px';
      occTooltip.style.borderRadius = '4px';
      occTooltip.style.zIndex = '10000';

      // Append the tooltip to the wrapper.
      const wrapper = this._cm.getWrapperElement();
      wrapper.appendChild(occTooltip);

      // Add tooltip hover behavior for the occurrence element.
      occElement.addEventListener('mouseenter', () => {
        occTooltip.style.display = 'block';
        const rect = occElement.getBoundingClientRect();
        const tooltipGap = -41; // Adjust gap if needed.
        occTooltip.style.top = `${rect.bottom + window.scrollY + tooltipGap}px`;
        occTooltip.style.left = `${rect.left + window.scrollX}px`;
      });
      occElement.addEventListener('mouseleave', () => {
        occTooltip.style.display = 'none';
      });

      // Use CodeMirror's markText to replace the text with occElement.
      const marker = this._cm.markText(startPos, endPos, {
        replacedWith: occElement,
        clearOnEnter: false,
      });

      // Save the marker so we can remove it later.
      paramElement.occurrenceMarkers.push(marker);
    });
  }

  hideOccurrenceMarkers(paramElement) {
    if (paramElement.occurrenceMarkers && paramElement.occurrenceMarkers.length > 0) {
      paramElement.occurrenceMarkers.forEach(marker => marker.clear());
      paramElement.occurrenceMarkers = [];
    }
  }

}

Editor.lintOptions = {
  'asi': true,
  'eqeqeq': false,
  '-W041': false,
  '-W083': false // loopfunc
};

export default Editor;
export { Editor };
