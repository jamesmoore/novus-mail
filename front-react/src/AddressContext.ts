import { createContext } from 'react';

export type AddressContextType = {
  selectedAddress: string;
  setSelectedAddress: (address: string) => void;
};

const AddressContext = createContext<AddressContextType>({
  selectedAddress: '',
  setSelectedAddress: () => { }
});

export default AddressContext;