import { EventEmitter } from 'events';

export interface NotificationEvents {
    received: (address: string) => void;
    read: (address: string) => void;
    softDeleted: (address: string) => void;
    hardDeleted: (address: string) => void;
    binEmptied: () => void;
    binRestored: () => void;
}

export class NotificationEmitter extends EventEmitter {
    public on<K extends keyof NotificationEvents>(
        event: K,
        listener: NotificationEvents[K]
    ): this {
        return super.on(event, listener);
    }

    public emit<K extends keyof NotificationEvents>(
        event: K,
        ...args: Parameters<NotificationEvents[K]>
    ): boolean {
        return super.emit(event, ...args);
    }

    public off<K extends keyof NotificationEvents>(
        event: K,
        listener: NotificationEvents[K]
    ): this {
        return super.off(event, listener);
    }

    public once<K extends keyof NotificationEvents>(
        event: K,
        listener: NotificationEvents[K]
    ): this {
        return super.once(event, listener);
    }
}
