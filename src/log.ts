// Imports
import chalk from "chalk";

// Defines timestamp formatter
export function now(): string {
    // Defines time
    const date = new Date();
    const hours = (date.getHours() % 12 || 12).toString().padStart(2, "0");
    const minutes = date.getMinutes().toString().padStart(2, "0");
    const seconds = date.getSeconds().toString().padStart(2, "0");
    const meridian = date.getHours() < 12 ? "AM" : "PM";

    // Constructs string
    const string = `${hours}:${minutes}:${seconds} ${meridian}`;
    
    // Return string
    return string;
}

// Defines info logger
export function info(content: string): void {
    // Constructs message
    const head = `[${now()}] INFO`;
    const body = content;
    const message = chalk.blue(`${head} | ${body}`);

    // Prints message
    console.log(message);
}

// Defines listen logger
export function listen(port: number): void {
    // Constructs message
    const head = `[${now()}] LISTEN`;
    const url = chalk.cyan(`http://localhost:${port}/`);
    const body = `Server listening on ${url}`;
    const message = chalk.green(`${head} | ${body}`);

    // Prints message
    console.log(message);
}

// Defines route logger
export function route(request: Request, response: Response): void {
    // Constructs message
    const head = `[${now()}] ROUTE`;
    const ip = chalk.cyan(request.headers.get("CF-Connecting-IP") ?? "Unknown");
    const url = chalk.cyan(request.url);
    const code = chalk.cyan(response.status);
    const body = `${ip} accessed ${url} with status ${code}`;
    const status = response.ok ? chalk.green("(OK)") : chalk.red("(FAILED)");
    const message = chalk.yellowBright(`${head} | ${body} ${status}`);

    // Prints message
    console.log(message);
}
