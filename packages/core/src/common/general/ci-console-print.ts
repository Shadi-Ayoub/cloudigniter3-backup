/**
 * When using Next.js commands, the environment is set by default based on the command:
 * next dev: Runs the project in development mode.
 * next build: Prepares the project for production mode.
 * next start: Runs the compiled project in production mode.
 * next export: Exports the project for static serving.
 */

type OutputFormat = 'TEXT' | 'TABLE' | 'JSON';
type OutputType = 'NORMAL' | 'HIGHLIGHT' | 'SUCCESS' | 'ERROR';

type consoleLogOptions = {
  format?: OutputFormat;
  caption?: string;
  messageType?: OutputType;
};

export interface CiConsolePrintInterface {
  label: string;
  message: string | object;
  options?: consoleLogOptions;
}

export function ciConsolePrint({
  label = '*',
  message = '',
  options = {
    format: 'TEXT',
    caption: 'Print',
    messageType: 'NORMAL',
  },
}: CiConsolePrintInterface) {
  const mode = process.env.NODE_ENV || 'production';

  if (mode !== 'development') {
    // console.log("%c.", "font-weight: bold; color: blue;");
    return;
  }

  let color = 'black';
  switch (options.messageType) {
    case 'HIGHLIGHT':
      color = 'blue';
      break;
    case 'SUCCESS':
      color = 'green';
      break;
    case 'ERROR':
      color = 'red';
      break;
    default:
      color = 'black';
  }

  const stack = new Error().stack;

  if (stack) {
    // const callerLine = stack.split("\n")[2]; // The line where the function was called
    // const filePathMatch = callerLine.match(/\((.*):\d+:\d+\)/); // Extract the file path from the stack trace
    // const fullPath = filePathMatch ? filePathMatch[1] : "unknown file";
    // const workingDirectory = process.cwd(); // Get the current working directory
    // const relativePath = fullPath.replace(workingDirectory, ""); // Make the path relative to the working directory

    switch (options.format) {
      case 'TABLE':
        // console.log(`[${relativePath} - ${componentName}]:`);
        console.log(`▶ [${label}]:`);
        printTable(message, options.caption);
        break;
      case 'JSON':
        // console.log(`[${relativePath} - ${componentName}]:`);
        console.log(`▶ [${label}]:`);
        if (options.caption) {
          console.log(
            `%c${options.caption.charAt(0).toUpperCase() + options.caption.slice(1)} JSON:`,
            `font-weight: normal; color: ${color};`
          );
        }
        console.log(`%c${JSON.stringify(message, null, 2)}`, `font-weight: normal; color: ${color};`);
        break;
      default: // TEXT
        // Convert message to string if it's an object
        const messageStr = typeof message === 'object' ? JSON.stringify(message, null, 2) : message;

        console.log(`▶ [${label}] %c${messageStr}`, `font-weight: normal; color: ${color};`);
    }
  } else {
    // Fallback if the stack trace is unavailable
    const messageStr = typeof message === 'object' ? JSON.stringify(message, null, 2) : message;
    console.log(`▶ [${label}] %c${messageStr}`, `font-weight: normal; color: ${color};`);
  }

  return null;
}

export function printTable(data: object | object[] | string, tableCaption: string = 'Print'): void {
  if (Array.isArray(data) && data.every((item) => typeof item === 'object')) {
    // If data is an array of objects, print as a table
    if (data.length !== 0) {
      console.log(
        `%c${tableCaption.charAt(0).toUpperCase() + tableCaption.slice(1)} Table:`,
        'font-weight: normal; color: blue;'
      );
      console.table(data);
    }
  } else if (typeof data === 'object' && data !== null) {
    // If data is a single object, convert it to an array with one item and print as a table
    console.log(
      `%c${tableCaption.charAt(0).toUpperCase() + tableCaption.slice(1)} Table:`,
      'font-weight: normal; color: blue;'
    );
    console.table([data]);
  } else {
    console.error(
      'Failed to print data as a table due to invalid data format. Please pass an object or an array of objects to the printTable utility function.'
    );
  }
}
