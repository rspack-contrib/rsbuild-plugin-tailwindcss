// The `include.jsx` imported by `not-include.ts` should not be excluded.
import './include.jsx';

function className() {
  return 'text-center';
}

const root = document.getElementById('root');
const element = document.createElement('div');
element.id = 'not-include';
element.className = className();
root?.appendChild(element);
