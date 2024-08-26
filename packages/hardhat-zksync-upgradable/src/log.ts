import chalk from 'chalk';

function logWarning(title: string, lines: string[] = []): void {
    log('Warning', title, lines);
}

function indent(text: string, amount: number, amount0 = amount): string {
    return text.replace(/^/gm, (_, i) => ' '.repeat(i === 0 ? amount0 : amount));
}

let silenced = false;

function log(prefix: string, title: string, lines: string[]): void {
    if (silenced) {
        return;
    }

    const parts = [`${chalk.yellow.bold(`${prefix}:`)} ${title}\n`];

    if (lines.length > 0) {
        parts.push(lines.map((l) => `${indent(l, 4)}\n`).join(''));
    }

    console.error(parts.join('\n'));
}

export function silenceWarnings(): void {
    logWarning(`All subsequent Upgrades warnings will be silenced.`, [
        `Make sure you have manually checked all uses of unsafe flags.`,
    ]);
    silenced = true;
}
