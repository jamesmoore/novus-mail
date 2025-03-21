export interface Address {
    addr: string;
    owner: string;
}

export interface AddressesResponse {
    addresses: Address[];
    refreshInterval: number;
}
