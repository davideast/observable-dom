# observable-dom

This is a fun experiment. Not packaged. A lot of stuff left to do. Not sure if it will even work. But hey, it's fun.

### The idea

Wouldn't it be awesome if you could re-render a template based on an observable emission?

```html
<observable-element initial-value='{ "name": "David", "age": 29 }'>
  <template>
    <div class="profile">
      {{ name }} - {{ age }}
    </div>
    <div class="profile-edit">
      <input #name placeholder="name" type="text">
      <input #age placeholder="age" type="text">
      <button (click)="update$">Update</button>
    </div>
  </template>
</observable-element>
```

```js
import { ObservableElement } from 'observable-dom';
import { of } from 'rxjs/create'; // rxjs v6

// Define it yourself to avoid any collisions
customElements.define('observable-element', ObservableElement);

const profileElement = document.querySelector('observable-element');
profileElement.setSource(of({ name: 'Coco', age: 99 }));
```

### Component Model

You can also subclass ObservableElement.

```js
import { ObservableElement } from 'observable-dom';
import { map } from 'rxjs/operators'; // rxjs v6
import { BehaviorSubject } from 'rxjs'; // rxjs v6

class Profile extends ObservableElement {

  getInitialValue() {
    return {
      name: 'David',
      age: 29
    };
  }

  connectedCallback() {
    this.setSource(new BehaviorSubject(this.getInitialValue()));

    // update the template every time the update button is clicked
    this.update$
      .pipe(
        map(_ => {
          // this.view is where the # values are stored
          // not sure if I like this
          const name = this.view.name.value;
          const age = parseInt(this.view.age.value, 10);
          return { name, age };
        }),
        map(newState => {
          const state = this.source$.getValue();
          return {
            ...state,
            ...newState
          };
        })
      )
      .subscribe(state => {
        this.source$.next(state);
      });
  }

}

customElements.define('profile-element', Profile);
```

Then in your document:

```html
<profile-element>
  <template>
    <div class="profile">
      {{ name }} - {{ age }}
    </div>
    <div class="profile-edit">
      <input #name placeholder="name" type="text">
      <input #age placeholder="age" type="text">
      <button (click)="update$">Update</button>
    </div>
  </template>
</profile-element>
```