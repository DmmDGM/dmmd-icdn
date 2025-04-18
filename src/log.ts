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

// Defines listen log
export function listen(port: number): void {
    // Constructs message
    const banner = `[${now()}] LISTEN`;
    const url = `http://localhost:${port}/`;
    const content = `Server listening on port ${chalk.cyan(port)} (${chalk.cyan(url)})`;
    const message = chalk.green(`${banner} | ${content}`);

    // Prints message
    console.log(message);
}

// Defines info log
export function info(content: string): void {
    // Constructs message
    const banner = `[${now()}] INFO`;
    const message = chalk.blue(`${banner} | ${content}`);

    // Prints message
    console.log(message);
}

// Defines route log
export function route(request: Request, response: Response): void {
    // Constructs message
    const banner = `[${now()}] ROUTE`;
    const content = `Accessed ${chalk.cyan(request.url)} with status ${chalk.cyan(response.status)}`;
    const status = response.ok ? chalk.green("(OK)") : chalk.red("(FAILED)");
    const message = chalk.yellowBright(`${banner} | ${content} ${status}`);

    // Prints message
    console.log(message);
}
