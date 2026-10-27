---
slug: "fjs-10"
topic: "frontend-js"
tier: DEEP
difficulty: 2
title: "프로토타입 체인이란 무엇이고, 속성 조회와 대입은 어떻게 동작하나요?"
keywords: ["객체의 [[Prototype]] 링크", "조회는 체인을 따라 올라감", "Object.prototype 뒤는 null", "대입은 자기 객체에 생성", "prototype 의 메서드는 인스턴스가 공유"]
has_extra: false
status: REVIEWED
reviewed_at: 2026-10-24
sources: ["https://tc39.es/ecma262/"]
concepts: [js-this-prototype]
importance: 2
links: [{to: "fjs-11", kind: FOLLOWUP}]
---
**모범 답변 (30~60초)**
모든 객체는 다른 객체 또는 `null`을 가리키는 `[[Prototype]]` 링크를 하나 가집니다. 속성을 읽을 때 자기 객체에 없으면 이 링크를 따라 올라가며 찾고, 끝은 `Object.prototype`을 지나 `null`입니다. 일반 데이터 속성에 값을 대입하면 체인을 거슬러 올라가 고치는 게 아니라 자기 객체에 속성이 새로 생겨서 프로토타입의 같은 이름을 가립니다. 생성자 함수의 `prototype`에 둔 메서드는 `new`로 만든 모든 인스턴스가 한 함수를 공유하고, 생성자 안에서 `this.f = function(){}`로 만들면 인스턴스마다 새 함수가 생깁니다.

```js
function Animal(name) { this.name = name; }
Animal.prototype.speak = function () { return this.name + ' makes a sound'; };
function Dog(name) { Animal.call(this, name); }
Dog.prototype = Object.create(Animal.prototype);
Dog.prototype.constructor = Dog;
const d = new Dog('rex');
d.speak();                                                // 'rex makes a sound'
Object.getPrototypeOf(d) === Dog.prototype;               // true
Object.getPrototypeOf(Dog.prototype) === Animal.prototype; // true
const base = { x: 1 }, child = Object.create(base);
child.x = 2;   // base.x 는 1, child.x 는 2
```

(공식 문서) ECMA-262 4.4.6은 객체가 하나의 프로토타입 객체를 가지며 그것이 `null`일 수도 있다고 하고, 4.4.8은 생성자가 만든 객체가 속성 조회를 위해 생성자의 `"prototype"` 속성을 암묵적으로 참조하며 프로토타입에 추가한 속성이 같은 프로토타입을 쓰는 모든 객체에 공유된다고 한다. OrdinaryGet(10.1.8.1)은 자기 객체에 속성 설명자가 없으면 `[[GetPrototypeOf]]`로 얻은 부모의 `[[Get]]`을 이어 호출하고 부모가 `null`이면 `undefined`를 돌려준다고 적는다.
(실험 확인) Node.js v24.16.0에서 위 블록의 결과가 나왔고, 체인 끝은 `Object.getPrototypeOf(Object.prototype) === null`이었다. `child.x`를 지우면 다시 `base.x`(1)가 읽혔고, 생성자 안에서 만든 `this.f`는 인스턴스끼리 다른 함수(`m1.f === m2.f`가 `false`), `prototype`의 `g`는 같은 함수(`true`)였다. `prototype`에 둔 배열은 모든 인스턴스가 공유해서 한 인스턴스의 `push`가 다른 인스턴스에도 보였다.
(공식 문서) 대입은 `[[Set]]`의 OrdinarySetWithOwnDescriptor(10.1.9.2)가 정한다. 자기 객체에 속성이 없으면 부모의 `[[Set]]`을 이어 호출하고, 체인 끝까지 데이터 속성이 없으면 원래 대상(receiver)에 CreateDataProperty로 새 데이터 속성을 만든다. 체인에서 쓰기 불가(writable false) 데이터 속성을 만나면 false를 돌려주고, 접근자 속성을 만나면 setter를 receiver를 this로 해서 호출한다. 7.3.4 Set은 `[[Set]]`이 false이고 throw가 true면 TypeError를 던진다고 적는다.
(실험 확인) strict 모드의 Node.js v24.16.0에서 프로토타입의 `writable: false` 속성에 자식 객체로 대입하면 TypeError였고 자식에는 속성이 생기지 않았다. 프로토타입에 setter가 있으면 setter가 호출되고(받은 값이 기록됨) 자식에 속성이 생기지 않았다.
