var t = document.querySelector('#t');
var container = document.querySelector('.od-container');

var findTokens = (text) => {
  const matches = text.match(/{{\s*[\w\.]+\s*}}/g) || [];
  return matches.map(function(x) { return x.match(/[\w\.]+/)[0]; });
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
  if(children.length > 0) {
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

function render({ host, template, data }) {
  const children = getChildren(host);
  const clone = template.content.cloneNode(true);
  let _host;
  let result;

  if(children.length === 0) {
    _host = template.content.cloneNode(true);
  } else {
    // re-render given the root element
    _host = host;
  }
  result = walk(_host, clone, data);
  
  // append the template on the first render
  if(!_host.isConnected) {
    host.appendChild(result);
  }
}

render({
  host: container,
  template: t,
  data: {
    name: 'Shannon',
    age: 29
  }
});
