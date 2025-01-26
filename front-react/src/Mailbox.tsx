import { useState, useEffect } from 'react';

interface Address {
  addr: string;
}

interface AddressesResponse {
  addresses: Address[];
  refreshInterval: number;
}

const handleCopy = async (text: string) => {
  try {
    await navigator.clipboard.writeText(text);
  } catch (err) {
    console.error('Failed to copy:', err);
  }
};

function Mailbox() {
  const [addresses, setAddresses] = useState<Address[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [domainName, setDomainName] = useState('...');
  const [selectedAddress, setSelectedAddress] = useState('');

  async function copyClicked() {
    await handleCopy(selectedAddress + domainName);
  }

  useEffect(() => {
    fetch('/addresses', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
    })
      .then(response => response.json())
      .then((data: AddressesResponse) => {
        setAddresses(data.addresses);
        setLoading(false);
        if (data.addresses.length > 0) {
          setSelectedAddress(data.addresses[data.addresses.length - 1].addr);
        }
      })
      .catch(error => {
        setError('Failed to fetch addresses ' + error);
        setLoading(false);
      });
  }, []);

  useEffect(() => {
    fetch('/domain', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
    })
      .then(response => response.text())
      .then((data: string) => {
        setDomainName('@' + data);
        setLoading(false);
      })
      .catch(error => {
        setError('Failed to fetch domain ' + error);
        setLoading(false);
      });
  }, []);

  if (loading) {
    return <div>Loading...</div>;
  }

  if (error) {
    return <div className="error">{error}</div>;
  }

  return (
    <main>
      <div className="adaptWidth flexCenterCol fillHeight gap">

        <div></div>

        <div className="adaptWidthSmall" style={{ display: "flex", alignItems: "center", flexWrap: "wrap" }}>
          <select style={{ flex: 1 }}
            value={selectedAddress}
            onChange={(event) => {
              setSelectedAddress(event.target.value);
            }}
          >
            {addresses.map((address, index) => (
              <option key={index} value={address.addr}>
                {address.addr}
              </option>
            ))}
          </select>
          <span>{domainName}</span>
          <button onKeyUp={copyClicked} onClick={copyClicked} style={{ marginLeft: "10px", paddingTop: "0px", paddingBottom: "0px" }}>Copy</button>
        </div>
      </div>
    </main>
  );
}

export default Mailbox;