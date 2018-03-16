
const findTokens = (text) => {
  const matches = text.match(/{{\s*[\w\.]+\s*}}/g) || [];
  return matches.map(function (x) { return x.match(/[\w\.]+/)[0]; });
}

const findEvents = (text) => {
  const matches = text.match(/(\s*[\w\.]+\s*)/g) || [];
  return matches.map(function (x) { return x.match(/[\w\.]+/)[0]; });
}

function replaceToken(string, token, value) {
  return string.replace(new RegExp('\{\{(?:\\s+)?(' + token + ')(?:\\s+)?\}\}'), value);
}

function startsWith(text, char) {
  const slice = text.substring(0, 1);
  return slice === char;
}

function endsWith(text, char) {
  const slice = text.substring(text.length, text.length - 1);
  return slice === char;
}

function getChildren(element) {
  return Array.prototype.filter.call(element.children, child => {
    return child.nodeName !== 'TEMPLATE';
  });
}

export function walk(hostNode, cloneNode, data) {
  const firstChild = cloneNode.firstChild;
  let nodeValue = '';

  // Is there a firstChild text node?  
  if(typeof firstChild !== 'undefined' && firstChild !== null) {
    nodeValue = firstChild.nodeValue || '';
  }
  const children = getChildren(hostNode);

  // replace each {{ }} template string 
  if(nodeValue.trim() !== '') {
    const tokens = findTokens(nodeValue);
  
    tokens.forEach(token => {
      nodeValue = replaceToken(nodeValue, token, data[token]);
    });

    // diff? lol no.
    hostNode.firstChild.nodeValue = nodeValue;
  }

  if (typeof cloneNode.attributes !== 'undefined') {
    const attrs = Object
      .keys(cloneNode.attributes)
      .map(key => cloneNode.attributes[key].name);

    const propAttributes = attrs
      .slice()
      .filter(attr => attr.startsWith(attr, '[') && endsWith(attr, ']'));

    propAttributes.forEach(propAttr => {
      const dataProp = cloneNode.getAttribute(propAttr);
      const name = propAttr.replace('[', '').replace(']', '');
      let prop = name;
      if(name.indexOf('-') > -1) {
        prop = name.split('-').reduce((prev, curr, i) => {
          if(i === 0) { return curr; }
          const cased = curr.substring(0, 1).toUpperCase() + 
            curr.substring(1, curr.length);
          return `${prev}${cased}`;
        });
      }
      cloneNode[prop] = data[dataProp];
      hostNode[prop] = cloneNode[prop];
    });
  }

  // recursively replace children
  if (children.length > 0) {
    Array.prototype.forEach.call(children, (child, i) => {
      walk(child, cloneNode.children[i], data);
    });
  }

  return hostNode;
}

export function createHost(cloneNode, data, events, elements) {
  const firstChild = cloneNode.firstChild;
  let nodeValue = '';

  // Is there a firstChild text node?  
  if(typeof firstChild !== 'undefined' && firstChild !== null) {
    nodeValue = firstChild.nodeValue || '';
  }
  const children = getChildren(cloneNode);

  // replace each {{ }} template string 
  if(nodeValue.trim() !== '') {
    const tokens = findTokens(nodeValue);
  
    tokens.forEach(token => {
      nodeValue = replaceToken(nodeValue, token, data[token]);
    });

    cloneNode.firstChild.nodeValue = nodeValue;
  }

  // set observable properties
  if (typeof cloneNode.attributes !== 'undefined') {
    const attrs = Object.keys(cloneNode.attributes)
      .map(key => cloneNode.attributes[key].name);
    const eventAttributes = attrs
      .slice()
      .filter(attr => startsWith(attr, '(') && endsWith(attr, ')'));

    const valueAttributes = attrs
      .slice()
      .filter(attr => startsWith(attr, '#'));
    
    eventAttributes.forEach(eventAttr => {
      const event = eventAttr.replace('(', '').replace(')', '');
      const name = cloneNode.attributes.getNamedItem(eventAttr).value;
      events[name] = { event, element: cloneNode };
    });

    valueAttributes.forEach(valueAttr => {
      const name = valueAttr.replace('#', '');
      elements[name] = cloneNode;
    });
  }

  // recursively replace children
  if (children.length > 0) {
    Array.prototype.forEach.call(children, (child, i) => {
      createHost(child, data, events, elements);
    });
  }

  return { host: cloneNode, events, elements };
}

export function renderHost({ host, template, data, appendChild = true }) {
  const children = getChildren(host);
  const clone = template.content.cloneNode(true);
  let _host;
  let fragment;
  const obsCollection = {};

  if (children.length === 0) {
    _host = template.content.cloneNode(true);
  } else {
    // re-render given the root element
    _host = host;
  }
  host.obs$ = {};
  fragment = walk(_host, clone, data, obsCollection);

  // append the template on the first render
  if (appendChild && !_host.isConnected) {
    host.appendChild(fragment);
  }

  return { fragment, obsCollection };
}

export function render({ selector, template, data }) {
  // lame tsc hack for so it can be iteration
  const hosts = document.querySelectorAll(selector);
  Array.prototype.forEach(hosts, host => {
    renderHost({ host, template, data });
  });
}
