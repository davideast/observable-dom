import { renderHost, createHost, walk } from '../render.js';

export class ObservableElement extends HTMLElement {

  setSource(val) {
    this.source$ = val;
    this.source$.subscribe(this._next.bind(this));
  }

  constructor() {
    super();
    this._nextTemplate = this.querySelector('template');
    
    // This element can be subclassed or it can used
    // directly. If there is a getInitialValue method
    // we are assuming they are using a subclass. If
    // there's not we assume they use it directly.
    let firstValue = {};
    if(typeof this.getInitialValue !== 'undefined') {
      firstValue = this.getInitialValue();
    } else {
      firstValue = JSON.parse(this.getAttribute('initial-value'));
    }

    const cloneNode = this._nextTemplate.content.cloneNode(true);

    const { host, events, elements } = createHost(
      cloneNode, 
      firstValue, 
      {},
      {}
    );

    this.appendChild(host);

    Object.keys(events).forEach(name => {
      let obs$ = Rx.Observable.fromEvent(
        events[name].element, events[name].event
      );
      Object.defineProperty(this, name, {
        value: obs$,
        writable: false
      });
    });

    Object.defineProperty(this, 'view', {
      value: elements,
      writable: false
    });
  }

  _next(data) {
    const cloneNode = this._nextTemplate.content.cloneNode(true);
    walk(this, cloneNode, data);
  }

}
