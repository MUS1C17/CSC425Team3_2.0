export function hello(name){
    return `Hello ${name}, nice to meet you!`;
}

if(typeof require !== "undefined" && require.main == module){
    console.log(hello("CSC425"));
}