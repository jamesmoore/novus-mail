import React from 'react';

export type AddressContextType = {
  selectedAddress: string;
  setSelectedAddress: (address: string) => void;
};

const AddressContext = React.createContext<AddressContextType>({
  selectedAddress: '',
  setSelectedAddress: () => { }
});

export default AddressContext;