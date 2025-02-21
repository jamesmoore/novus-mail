"use strict";
import { readFileSync } from 'fs';

interface ConfigType {
    [key: string]: string | number;
}

const mod = {
    configs: {} as ConfigType,
    getConfig: function(key: string): string | number {
        return (this.configs[key] as unknown) as string | number;
    },
    init: function(): void {
        try {
            const data = readFileSync('./data/config.json', 'utf8');
            this.configs = JSON.parse(data) as ConfigType;
        } catch (err) {
            console.log('Error reading config.json');
            console.log(err);
            process.exit();
        }
    }
};

export default mod;
