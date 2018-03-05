
class ObservableObject extends HTMLElement {

  setSource(val) {
    this.source$ = val;
    this.source$.subscribe(this._next.bind(this));
  }

  constructor() {
    super();
    this._nextTemplate = this.querySelector('template');
  }

  _next(data) {
    renderHost({
      host: this,
      template: this._nextTemplate,
      data
    });
  }

}

const findTokens = (text) => {
  const matches = text.match(/{{\s*[\w\.]+\s*}}/g) || [];
  return matches.map(function (x) { return x.match(/[\w\.]+/)[0]; });
}

function replaceToken(string, token, value) {
  return string.replace(new RegExp('\{\{(?:\\s+)?(' + token + ')(?:\\s+)?\}\}'), value);
}

function walk(node, clone, data) {
  const nodeValue = clone.firstChild.nodeValue;
  const tokens = findTokens(nodeValue);
  const children = getChildren(node);

  // replace each {{ }} template string 
  tokens.forEach(token => {
    clone.firstChild.nodeValue = replaceToken(clone.firstChild.nodeValue, token, data[token]);
  });

  // diff? lol no.
  node.firstChild.nodeValue = clone.firstChild.nodeValue;

  // recursively replace children
  if (children.length > 0) {
    Array.prototype.forEach.call(children, (child, i) => {
      walk(child, clone.children[i], data);
    });
  }

  return node;
}

function getChildren(element) {
  return Array.prototype.filter.call(element.children, child => {
    return child.nodeName !== 'TEMPLATE';
  });
}

function renderHost({ host, template, data, appendChild = true }) {
  const children = getChildren(host);
  const clone = template.content.cloneNode(true);
  let _host;
  let result;

  if (children.length === 0) {
    _host = template.content.cloneNode(true);
  } else {
    // re-render given the root element
    _host = host;
  }
  result = walk(_host, clone, data);

  // append the template on the first render
  if (appendChild && !_host.isConnected) {
    host.appendChild(result);
  }

  return result;
}

function render({ selector, template, data }) {
  const hosts = document.querySelectorAll(selector);
  Array.prototype.map.forEach(hosts, host => {
    renderHost({ host, template, data });
  });
}

customElements.define('observable-object', ObservableObject);

const obs = document.querySelector('observable-object');
const d = {
  0: { name: 'Molly', age: 8 },
  1: { name: 'David', age: 29 },
  2: { name: 'Shannon', age: 30 },
  3: { name: 'Mambo', age: 3},
  4: { name: 'Cash', age: 5 },
  5: { name: 'Coco', age: 2 }
};
let count = 0;
const items$ = Rx.Observable.create(subscriber => {
  const id = setInterval(() => {
    if (count > 5) {
      subscriber.complete();
      clearInterval(id);
      return;
    }
    subscriber.next(d[count]);
    count = count + 1;
  }, 1000);
});

obs.setSource(items$);
