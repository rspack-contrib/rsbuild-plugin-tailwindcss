// The `not-exclude.js` imported by `exclude.js` should not be excluded.
import './not-exclude.js';

function className() {
  return 'text-center';
}

const root = document.getElementById('root');
const element = document.createElement('div');
element.id = 'exclude';
element.className = className();
root.appendChild(element);
