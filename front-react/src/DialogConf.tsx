interface DialogConfProps {
    visible: boolean;
    text: string;
}

function DialogConf({ visible, text }: DialogConfProps) {

    async function dialogConfirmYesClicked(e: React.MouseEvent<HTMLButtonElement>) {
        console.log(e);
    }

    async function dialogConfirmNoClicked(e: React.MouseEvent<HTMLButtonElement>) {
        console.log(e);
    }

    return (
        visible && <div style={{ width: "100%", height: "100%", position: "absolute", display: "flex", justifyContent: "center", alignItems: "center" }}>
            <div id="dialogBox" style={{ width: "min(300px, calc(100% - 40px))", boxSizing: "border-box", padding: "10px", minHeight: "50px", display: "flex", flexDirection: "column", alignItems: "center", gap: "10px" }}>
                <span id="dialogBoxText">{text}</span>
                <div style={{ display: "flex", flexWrap: "wrap", justifyContent: "center", gap: "10px" }}>
                    <button id="dialogBoxYesButton" onClick={dialogConfirmYesClicked} style={{ width: "100px" }} tabIndex={0}>Yes</button>
                    <button onClick={dialogConfirmNoClicked} style={{ width: "100px" }} tabIndex={0}>No</button>
                </div>
            </div>
        </div>
    )
}

export default DialogConf;