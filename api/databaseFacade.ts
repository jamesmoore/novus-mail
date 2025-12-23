import { Database } from "better-sqlite3";

export class DatabaseFacade {
    private db: Database;

    constructor(db: Database) {
        this.db = db;
    }

    public getAddressOwner(address: string) {
        return this.db
            .prepare("SELECT owner FROM address WHERE addr = ?")
            .get(address) as { owner: string | null; } | undefined;
    }

}
