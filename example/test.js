const {spec: {spec, check, rules}} = require('../src/main'); // require('@toadperson/sync-validator-chain')

const testSpec = spec('test').isIn(["foo", "bar"])

const testSpec1 = spec('test1').equals("foo")


let result;

result = check(testSpec, "baz")

console.log('isValid:', result.isValid());
console.log('conform:', result.conform());
console.log('explain:', result.explain());


result = check(testSpec1, "foo")

console.log('isValid:', result.isValid());
console.log('conform:', result.conform());
console.log('explain:', result.explain());


let spec1 = spec('spec1').trim().isInt({min: 0, max: 10}).toInt();
let spec2 = spec('spec2').trim().isInt({min: 50, max: 60}).toInt();

let spec3 = spec('spec3').or(spec1, spec2)

// console.log('spec3:', spec3);
// console.log('spec3:', JSON.stringify(spec3));

result = check(spec3, "11")

console.log('isValid:', result.isValid());
console.log('conform:', result.conform());
console.log('explain:', result.explain());

// console.log(rules().length)
// console.dir(rules(), {maxArrayLength: null})

// function Foo(name) {
//     this.name = name;
// }
//
// let foo = new Foo("foo");
//
// Foo.prototype.toString = function () {
//     return '-' + this.name;
// }
//
// console.log(Object.keys(Foo.prototype))
//
// console.log('' + foo)

let m = new Map();
m.set('foo', [(...args) => {console.log(args)}, [1, 2]])
m.set('bar', [(...args) => {console.log(args)}, [5, 6]])

console.log([...m].map(([key, [fn, args]]) => key))