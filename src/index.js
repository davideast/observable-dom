import { ObservableObject } from './elements/observable-object.js';

class MyElement extends ObservableObject {

  getInitialValue() {
    return {
      name: 'Bobo',
      age: 129
    };
  }

  connectedCallback() {
    this.setSource(people$());    
  }

}

customElements.define('my-element', MyElement);
// customElements.define('observable-object', ObservableObject);

const profile = document.querySelector('my-element');
// const user$ = Rx.Observable.of({ name: 'Molly', age: 8 });
// profile.setSource(user$);


profile.nameValue$.subscribe(console.log);
profile.nameClick$.subscribe(console.log);

function people$() {
  const d = {
    0: { name: 'Molly', age: 8 },
    1: { name: 'David', age: 29 },
    2: { name: 'Shannon', age: 30 },
    3: { name: 'Mambo', age: 3},
    4: { name: 'Cash', age: 5 },
    5: { name: 'Coco', age: 2 }
  };
  let count = 0;
  return Rx.Observable.create(subscriber => {
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
}