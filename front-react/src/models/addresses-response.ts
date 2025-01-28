export interface Address {
    addr: string;
}

export interface AddressesResponse {
    addresses: Address[];
    refreshInterval: number;
}
