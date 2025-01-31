import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import DialogAlert from './DialogAlert';
import DialogConf from './DialogConf';
import { fetchAddress, fetchDomain, addAddress as apiAddAddress, deleteAddress as apiDeleteAddress } from './api-client';
import { useQuery } from '@tanstack/react-query';

function Manage() {
    const [newAddressText, setNewAddressText] = useState('');
    const [selectedAddress, setSelectedAddress] = useState('');
    const navigate = useNavigate();
    const [alertText, setAlertText] = useState<string | null>(null);
    const [alertVisible, setAlertVisible] = useState(false);
    const [deleteConfirm, setdeleteConfirm] = useState(false);

    const { data: domainName } = useQuery(
        {
            queryKey: ["domain"],
            queryFn: fetchDomain
        }
    );

    const { data: addressesResponse, error, refetch: refreshAddresses } = useQuery(
        {
            queryKey: ["addresses"],
            queryFn: fetchAddress
        }
    )

    useEffect(
        () => {
            if (addressesResponse && addressesResponse.addresses.length > 0) {
                const addresses = addressesResponse.addresses;
                setSelectedAddress(addresses[addresses.length - 1].addr);
            }
        },
        [addressesResponse]
    );

    function addAddress() {
        const regex = /^(?!\.)(?!.*\.\.)(?!.*\.$)[A-Za-z0-9!#$%&'*+/=?^_`{|}~.-]{1,64}$/;
        if (regex.test(newAddressText)) {
            apiAddAddress(newAddressText)
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
        apiDeleteAddress(selectedAddress)
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
        return <div className="error">{error.message}</div>;
    }

    return (
        <main>
            <div className="adaptWidth flexCenterCol fillHeight gap">
                <div></div>

                {/*New mails*/}
                <span>New mail address</span>
                <div className="adaptWidthSmall" style={{ display: "flex", flexWrap: "wrap" }}>
                    <input type="text" onChange={event => setNewAddressText(event.target.value)} value={newAddressText} placeholder="New address" style={{ flex: 1 }} />
                    <span>@{domainName}</span>
                </div>
                <button onClick={addAddress} className="adaptWidthSmall">Add this address</button>

                <div style={{ height: "30px" }}></div>

                {/*List of existing addresses*/}
                <span>Manage addresses</span>
                <div className="adaptWidthSmall" style={{ display: "flex", flexWrap: "wrap" }}>
                    <select value={selectedAddress} style={{ flex: "1" }}>
                        {addressesResponse && addressesResponse.addresses.map((address, index) => (
                            <option key={index} value={address.addr}>
                                {address.addr}
                            </option>
                        ))}
                    </select>
                    <span>@{domainName}</span>
                </div>

                {/*Delete selected address*/}
                <button disabled={addressesResponse === undefined || addressesResponse.addresses.length == 0} onClick={deleteAddress} className="adaptWidthSmall">Delete this address</button>
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