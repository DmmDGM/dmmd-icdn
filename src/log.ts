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

// Defines loggers
export function info(message: string): void {
    // Prints message
    console.log(chalk.cyan(`[${now()}] INFO | ${message}`));
}
