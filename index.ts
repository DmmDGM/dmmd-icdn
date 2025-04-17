// // Imports
// import * as log from "./src/log";

// // Serves content
// Bun.serve()

console.log(await Bun.file("./env.d.ts").text());
console.log(Bun.file("./env.d.ts").name);
