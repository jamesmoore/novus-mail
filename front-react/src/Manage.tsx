import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { AddressesResponse, Address } from './models/addresses-response';
import DialogAlert from './DialogAlert';
import DialogConf from './DialogConf';

function Manage() {
    const [newAddressText, setNewAddressText] = useState('');
    const [hostName, setHostName] = useState('...');
    const [error, setError] = useState<string | null>(null);
    const [selectedAddress, setSelectedAddress] = useState('');
    const [addresses, setAddresses] = useState<Address[]>([]);
    const navigate = useNavigate();

    const [alertText, setAlertText] = useState<string | null>(null);
    const [alertVisible, setAlertVisible] = useState(false);

    const [deleteConfirm, setdeleteConfirm] = useState(false);

    useEffect(() => {
        fetch('/domain', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
        })
            .then(response => response.text())
            .then((data: string) => {
                setHostName('@' + data);
            })
            .catch(error => {
                setError('Failed to fetch domain ' + error);
            });
    }, []);

    useEffect(refreshAddresses, []);

    function refreshAddresses() {
        fetch('/addresses', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
        })
            .then(response => response.json())
            .then((data: AddressesResponse) => {
                setAddresses(data.addresses);
                if (data.addresses.length > 0) {
                    setSelectedAddress(data.addresses[data.addresses.length - 1].addr);
                }
            })
            .catch(error => {
                setError('Failed to fetch addresses ' + error);
            });
    }

    function addAddress() {
        const regex = /^(?!\.)(?!.*\.\.)(?!.*\.$)[A-Za-z0-9!#$%&'*+/=?^_`{|}~.-]{1,64}$/;
        if (regex.test(newAddressText)) {
            fetch('/addAddress', {
                method: 'POST',
                body: JSON.stringify(
                    {
                        address: newAddressText,
                    }
                ),
                headers: {
                    'Content-Type': 'application/json',
                }
            })
                .then(response => response.text())
                .then((data: string) => {
                    if (data == "exist") {
                        setAlertText("address already exist");
                        setAlertVisible(true);
                    }

                    if (data == "done") {
                        setNewAddressText("");
                        refreshAddresses();
                    }
                }
                );
        } else {
            setAlertText("Invalid email address");
            setAlertVisible(true);
        }
    }

    function deleteAddress() {
        setdeleteConfirm(true);
    }

    function deleteYes() {
        fetch('/deleteaddress', {
            method: 'POST',
            body: JSON.stringify({
                address: selectedAddress,
            }),
            headers: {
                'Content-Type': 'application/json',
            }
        })
            .then(response => response.text())
            .then((data: string) => {
                if (data === 'done') {
                    setdeleteConfirm(false);
                    refreshAddresses();
                }
            });
    }

    function deleteNo() {
        setdeleteConfirm(false);
    }

    function alertOk() {
        setAlertVisible(false);
    }

    if (error) {
        return <div className="error">{error}</div>;
    }

    return (
        <main>
            <div className="adaptWidth flexCenterCol fillHeight gap">
                <div></div>

                {/*New mails*/}
                <span>New mail address</span>
                <div className="adaptWidthSmall" style={{ display: "flex", flexWrap: "wrap" }}>
                    <input type="text" onChange={event => setNewAddressText(event.target.value)} value={newAddressText} placeholder="New address" style={{ flex: 1 }} />
                    <span>{hostName}</span>
                </div>
                <button onClick={addAddress} className="adaptWidthSmall">Add this address</button>

                <div style={{ height: "30px" }}></div>

                {/*List of existing addresses*/}
                <span>Manage addresses</span>
                <div className="adaptWidthSmall" style={{ display: "flex", flexWrap: "wrap" }}>
                    <select value={selectedAddress} style={{ flex: "1" }}>
                        {addresses.map((address, index) => (
                            <option key={index} value={address.addr}>
                                {address.addr}
                            </option>
                        ))}
                    </select>
                    <span>{hostName}</span>
                </div>

                {/*Delete selected address*/}
                <button disabled={addresses.length == 0} onClick={deleteAddress} className="adaptWidthSmall">Delete this address</button>
                <div style={{ flex: "1" }}></div>

                <button onClick={() => { navigate('/'); }} className="adaptWidthSmall" style={{ justifyContent: "flex-end" }}>Back</button>

                <div></div>
            </div>
            <DialogAlert text={alertText ?? "..."} visible={alertVisible} onOk={alertOk}></DialogAlert>
            <DialogConf visible={deleteConfirm} text="delete this address ?" onNo={deleteNo} onYes={deleteYes} ></DialogConf>
        </main >
    );
}

export default Manage;